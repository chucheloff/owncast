import React, { FC } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ComponentError } from '../ComponentError/ComponentError';

export type MobileContentProps = {
  online: boolean;
};

// lazy loaded components

const ComponentErrorFallback = ({ error, resetErrorBoundary }) => (
  <ComponentError
    message={error}
    componentName="MobileContent"
    retryFunction={resetErrorBoundary}
  />
);

export const MobileContent: FC<MobileContentProps> = () => (
  <ErrorBoundary
    // eslint-disable-next-line react/no-unstable-nested-components
    fallbackRender={({ error, resetErrorBoundary }) => (
      <ComponentErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
    )}
  >
    <div />
  </ErrorBoundary>
);
