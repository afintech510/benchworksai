"""Redis-backed circuit breaker (Spec Section 8.4).

Applied to: Smartlead, Apollo, Claude API calls.
Trips after 5 consecutive 5xx failures within 60s.
Recovery: 300s TTL, half-open probe on expiry.
Redis failure → fail open (allow calls).
"""
import structlog

logger = structlog.get_logger()


class CircuitOpenError(Exception):
    def __init__(self, service_name: str):
        self.service_name = service_name
        super().__init__(f"Circuit breaker open for {service_name}")


class CircuitBreaker:
    def __init__(
        self,
        service_name: str,
        redis_client,
        failure_threshold: int = 5,
        window_seconds: int = 60,
        recovery_seconds: int = 300,
    ):
        self.service_name = service_name
        self.redis = redis_client
        self.failure_threshold = failure_threshold
        self.window_seconds = window_seconds
        self.recovery_seconds = recovery_seconds
        self._failure_key = f"circuit:{service_name}:failures"
        self._open_key = f"circuit:{service_name}:open"

    async def is_open(self) -> bool:
        try:
            return bool(self.redis and self.redis.exists(self._open_key))
        except Exception:
            return False  # Redis down → fail open

    async def call(self, func, *args, **kwargs):
        """Execute function through circuit breaker."""
        if await self.is_open():
            # Half-open: check if TTL expired (key gone = allow probe)
            raise CircuitOpenError(self.service_name)

        try:
            result = func(*args, **kwargs)
            await self._record_success()
            return result
        except Exception as e:
            await self._record_failure()
            raise

    async def call_async(self, func, *args, **kwargs):
        """Execute async function through circuit breaker."""
        if await self.is_open():
            raise CircuitOpenError(self.service_name)

        try:
            result = await func(*args, **kwargs)
            await self._record_success()
            return result
        except Exception as e:
            await self._record_failure()
            raise

    async def _record_success(self):
        try:
            if self.redis:
                self.redis.delete(self._failure_key)
                self.redis.delete(self._open_key)
        except Exception:
            pass

    async def _record_failure(self):
        try:
            if not self.redis:
                return
            count = self.redis.incr(self._failure_key)
            if count == 1:
                self.redis.expire(self._failure_key, self.window_seconds)
            if count >= self.failure_threshold:
                self.redis.set(self._open_key, "1", ex=self.recovery_seconds)
                logger.error(
                    "circuit_breaker_tripped",
                    service=self.service_name,
                    failures=count,
                )
        except Exception as e:
            logger.warning("circuit_breaker_redis_error", error=str(e))


def get_circuit_breaker(service_name: str) -> CircuitBreaker:
    """Get a circuit breaker instance. Redis client initialized lazily."""
    try:
        import redis as redis_lib
        from app.config import get_settings
        settings = get_settings()
        r = redis_lib.from_url(settings.redis_url)
        return CircuitBreaker(service_name, r)
    except Exception:
        return CircuitBreaker(service_name, None)
