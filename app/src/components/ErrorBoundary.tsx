/**
 * React Error Boundary for mobile app
 * Catches and handles errors gracefully with fallback UI
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  reportErrors?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches React component errors and displays fallback UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error
    console.error('ErrorBoundary caught error:', error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service (e.g., Sentry)
    if (this.props.reportErrors !== false) {
      this.reportError(error, errorInfo);
    }
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // TODO: Integrate with error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
    console.log('Error reported:', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error!,
          this.state.errorInfo!,
          this.handleReset
        );
      }

      // Default fallback UI
      return (
        <DefaultErrorFallback
          error={this.state.error!}
          errorInfo={this.state.errorInfo!}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI
 */
interface DefaultErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  onReset: () => void;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  errorInfo,
  onReset,
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>糟糕！發生錯誤</Text>
        <Text style={styles.message}>
          應用程式遇到了問題，請稍後再試。
        </Text>

        <TouchableOpacity style={styles.button} onPress={onReset}>
          <Text style={styles.buttonText}>重新載入</Text>
        </TouchableOpacity>

        {__DEV__ && (
          <>
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => setShowDetails(!showDetails)}
            >
              <Text style={styles.detailsButtonText}>
                {showDetails ? '隱藏' : '顯示'}錯誤詳情
              </Text>
            </TouchableOpacity>

            {showDetails && (
              <ScrollView style={styles.errorDetails}>
                <Text style={styles.errorText}>
                  <Text style={styles.errorLabel}>錯誤訊息：</Text>
                  {'\n'}
                  {error.toString()}
                </Text>

                {error.stack && (
                  <Text style={styles.errorText}>
                    <Text style={styles.errorLabel}>堆疊追蹤：</Text>
                    {'\n'}
                    {error.stack}
                  </Text>
                )}

                {errorInfo.componentStack && (
                  <Text style={styles.errorText}>
                    <Text style={styles.errorLabel}>組件堆疊：</Text>
                    {'\n'}
                    {errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}
          </>
        )}
      </View>
    </View>
  );
};

/**
 * Error boundary for specific screen/feature
 * Allows partial error recovery
 */
interface ScreenErrorBoundaryProps {
  children: ReactNode;
  screenName: string;
  onError?: (error: Error) => void;
}

export const ScreenErrorBoundary: React.FC<ScreenErrorBoundaryProps> = ({
  children,
  screenName,
  onError,
}) => {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    console.error(`Error in ${screenName}:`, error);
    onError?.(error);
  };

  const renderFallback = (error: Error, errorInfo: ErrorInfo, reset: () => void) => (
    <View style={styles.screenErrorContainer}>
      <Text style={styles.screenErrorTitle}>無法載入 {screenName}</Text>
      <Text style={styles.screenErrorMessage}>請稍後再試</Text>
      <TouchableOpacity style={styles.button} onPress={reset}>
        <Text style={styles.buttonText}>重試</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ErrorBoundary onError={handleError} fallback={renderFallback}>
      {children}
    </ErrorBoundary>
  );
};

/**
 * Async error boundary for async operations
 * Handles promise rejections
 */
export class AsyncErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private unhandledRejectionListener: any = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  componentDidMount() {
    // Listen for unhandled promise rejections
    if (typeof window !== 'undefined') {
      this.unhandledRejectionListener = (event: PromiseRejectionEvent) => {
        this.handleAsyncError(event.reason);
      };

      window.addEventListener('unhandledrejection', this.unhandledRejectionListener);
    }
  }

  componentWillUnmount() {
    if (this.unhandledRejectionListener) {
      window.removeEventListener('unhandledrejection', this.unhandledRejectionListener);
    }
  }

  handleAsyncError = (error: any) => {
    const errorObj = error instanceof Error ? error : new Error(String(error));

    this.setState({
      hasError: true,
      error: errorObj,
      errorInfo: {
        componentStack: 'Async error (no component stack available)',
      } as ErrorInfo,
    });

    if (this.props.onError) {
      this.props.onError(errorObj, this.state.errorInfo!);
    }
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AsyncErrorBoundary caught error:', error, errorInfo);

    this.setState({
      errorInfo,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error!,
          this.state.errorInfo!,
          this.handleReset
        );
      }

      return (
        <DefaultErrorFallback
          error={this.state.error!}
          errorInfo={this.state.errorInfo!}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Error reporting utilities
 */
export const ErrorReporter = {
  /**
   * Report error to tracking service
   */
  report(error: Error, context?: Record<string, any>) {
    // TODO: Integrate with error tracking service
    console.error('Error reported:', {
      error: error.toString(),
      stack: error.stack,
      context,
    });
  },

  /**
   * Report user feedback with error
   */
  reportWithFeedback(error: Error, userFeedback: string) {
    // TODO: Integrate with error tracking service
    console.error('Error with user feedback:', {
      error: error.toString(),
      feedback: userFeedback,
    });
  },
};

/**
 * Retry mechanism for failed operations
 */
export class RetryManager {
  private maxRetries: number;
  private retryDelay: number;

  constructor(maxRetries: number = 3, retryDelay: number = 1000) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  async execute<T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: number, error: Error) => void
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.maxRetries) {
          onRetry?.(attempt, lastError);

          // Exponential backoff
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  detailsButtonText: {
    color: '#007AFF',
    fontSize: 14,
    textAlign: 'center',
  },
  errorDetails: {
    marginTop: 16,
    maxHeight: 300,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
    marginBottom: 12,
  },
  errorLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  screenErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  screenErrorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  screenErrorMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
});

/**
 * Usage examples:
 *
 * 1. App-level error boundary:
 *    <ErrorBoundary>
 *      <App />
 *    </ErrorBoundary>
 *
 * 2. Screen-level error boundary:
 *    <ScreenErrorBoundary screenName="Workout">
 *      <WorkoutScreen />
 *    </ScreenErrorBoundary>
 *
 * 3. Custom fallback:
 *    <ErrorBoundary
 *      fallback={(error, errorInfo, reset) => (
 *        <CustomErrorUI error={error} onReset={reset} />
 *      )}
 *    >
 *      <Component />
 *    </ErrorBoundary>
 *
 * 4. Async error handling:
 *    <AsyncErrorBoundary
 *      onError={(error) => ErrorReporter.report(error)}
 *    >
 *      <AsyncComponent />
 *    </AsyncErrorBoundary>
 */
