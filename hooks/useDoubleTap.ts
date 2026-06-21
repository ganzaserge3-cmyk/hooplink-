"use client";

import { useEffect, useRef } from "react";

export function useDoubleTap(
    callback: () => void,
    delay: number = 300
): React.RefObject<HTMLDivElement> {
    const lastTapRef = useRef<number>(0);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        function handleClick(event: MouseEvent) {
            const now = Date.now();
            const timeSinceLastTap = now - lastTapRef.current;

            if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
                event.preventDefault();
                callback();
                lastTapRef.current = 0;
            } else {
                lastTapRef.current = now;
            }
        }

        element.addEventListener("click", handleClick);

        return () => {
            element.removeEventListener("click", handleClick);
        };
    }, [callback, delay]);

    return elementRef;
}