import { useEffect } from 'react';

type KeyBinding = {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    action: () => void;
};

export function useKeyboardShortcuts(bindings: KeyBinding[]) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            for (const binding of bindings) {
                const ctrlMatch = binding.ctrl === undefined || binding.ctrl === event.ctrlKey;
                const shiftMatch = binding.shift === undefined || binding.shift === event.shiftKey;
                const altMatch = binding.alt === undefined || binding.alt === event.altKey;
                const keyMatch = binding.key.toLowerCase() === event.key.toLowerCase();

                if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
                    event.preventDefault();
                    binding.action();
                    break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [bindings]);
}
