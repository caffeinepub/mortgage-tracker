interface LoadingAnimationProps {
  message?: string;
  progress?: number;
  isStalled?: boolean;
  step?: string;
}

export default function LoadingAnimation({ 
  message = 'Loading...', 
  progress = 0,
  isStalled = false,
  step = 'Initializing...'
}: LoadingAnimationProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-6 max-w-md w-full px-4">
        {/* Rotating house icon with pulsing effect */}
        <div className="relative inline-flex items-center justify-center">
          {/* Outer pulsing ring */}
          <div className="absolute h-24 w-24 rounded-full bg-primary/20 animate-ping" />
          
          {/* Middle rotating ring */}
          <div className="absolute h-20 w-20 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          
          {/* Inner house icon */}
          <div className="relative h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <img 
              src="/assets/generated/house-loading-icon-transparent.dim_64x64.png" 
              alt="Loading" 
              className="h-10 w-10 opacity-80"
            />
          </div>
        </div>

        {/* Loading text */}
        <div className="space-y-3">
          <p className="text-lg font-semibold text-foreground">{message}</p>
          
          {/* Loading step indicator */}
          {step && (
            <p className="text-sm text-muted-foreground font-medium animate-pulse">
              {step}
            </p>
          )}
          
          {/* Progress indicator */}
          {progress > 0 && (
            <div className="space-y-2">
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                {progress < 100 ? `${Math.round(progress)}%` : 'Complete!'}
              </p>
            </div>
          )}

          {/* Stalled warning */}
          {isStalled && (
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
              Taking longer than expected... Please wait.
            </p>
          )}

          {/* Bouncing dots */}
          <div className="flex items-center justify-center gap-1">
            <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
            <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}
