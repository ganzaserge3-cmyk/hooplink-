type BrandMarkProps = {
  className?: string;
};

export default function BrandMark({ className = "" }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 64 40"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 6C10 4.89543 10.8954 4 12 4H17.5C18.6046 4 19.5 4.89543 19.5 6V34C19.5 35.1046 18.6046 36 17.5 36H12C10.8954 36 10 35.1046 10 34V6Z"
        fill="currentColor"
      />
      <circle cx="32" cy="20" r="5.5" fill="currentColor" />
      <path
        d="M42 6C42 4.89543 42.8954 4 44 4H49.5C50.6046 4 51.5 4.89543 51.5 6V26.5H58C59.1046 26.5 60 27.3954 60 28.5V34C60 35.1046 59.1046 36 58 36H44C42.8954 36 42 35.1046 42 34V6Z"
        fill="currentColor"
      />
    </svg>
  );
}
