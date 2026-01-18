import { useEffect, useRef } from 'react';

/**
 * Hook that alerts clicks outside of the passed ref
 */
export function useDetectClickOutside({ onTriggered }) {
    const ref = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (ref.current && !ref.current.contains(event.target)) {
                onTriggered(event);
            }
        }

        // Bind the event listener
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);

        return () => {
            // Unbind the event listener on clean up
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [onTriggered]);

    return ref;
}
