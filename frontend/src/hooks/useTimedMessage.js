import { useCallback, useEffect, useRef, useState } from 'react';

export default function useTimedMessage(defaultTimeout = 4000) {
  const timeoutRef = useRef(null);
  const [message, setMessage] = useState(null);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setMessage(null);
  }, []);

  const show = useCallback((text, options = {}) => {
    const { error = false, timeoutMs = defaultTimeout } = options;

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setMessage({ text, error });

    if (timeoutMs > 0) {
      timeoutRef.current = window.setTimeout(() => {
        setMessage(null);
        timeoutRef.current = null;
      }, timeoutMs);
    }
  }, [defaultTimeout]);

  useEffect(() => clear, [clear]);

  return { message, show, clear };
}
