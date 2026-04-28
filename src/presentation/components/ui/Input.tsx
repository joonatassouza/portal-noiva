import { InputHTMLAttributes, forwardRef } from 'react';
import { cx } from './cx';

type InputSize = 'sm' | 'md';

// Note: <input>'s native `size` is `number` — we omit it and add our own.
type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  inputSize?: InputSize;
};

const sizeMap: Record<InputSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-3 text-sm',
};

/** Plain text input with token styling. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, inputSize = 'md', type = 'text', ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cx(
        'block w-full rounded-md border border-border bg-bg text-ink placeholder:text-muted',
        'focus:border-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40',
        sizeMap[inputSize],
        className,
      )}
      {...rest}
    />
  );
});
