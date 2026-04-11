import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '../../../components/ui/Input';

type InputProps = React.ComponentPropsWithoutRef<typeof Input>;

/**
 * Password input with show/hide toggle.
 * Wraps the shared Input component — all Input props pass through.
 */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'rightIcon'>>(
  (props, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <Input
        ref={ref}
        {...props}
        type={visible ? 'text' : 'password'}
        rightIcon={
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible((v) => !v)}
            className="text-[var(--ink-light)] hover:text-[var(--ink)] transition-colors"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        }
      />
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
