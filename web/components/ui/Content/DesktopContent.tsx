import React, { ComponentType, FC } from 'react';
import dynamic from 'next/dynamic';
import { TabsProps } from 'antd';
import { ErrorBoundary } from 'react-error-boundary';
import styles from './Content.module.scss';
import { CustomPageContent } from '../CustomPageContent/CustomPageContent';
import { ComponentError } from '../ComponentError/ComponentError';

export type DesktopContentProps = {
  extraPageContent: string;
  supportFediverseFeatures: boolean;
};

// lazy loaded components

const Tabs: ComponentType<TabsProps> = dynamic(() => import('antd').then(mod => mod.Tabs), {
  ssr: false,
});

export const DesktopContent: FC<DesktopContentProps> = ({
  extraPageContent,
  supportFediverseFeatures,
}) => {
  const aboutTabContent = (
    <div className={styles.bottomPageContentContainer}>
      <CustomPageContent content={extraPageContent} />
    </div>
  );

  const followersTabContent = <div />;
  const items = [!!extraPageContent && { label: 'About', key: '2', children: aboutTabContent }];
  if (supportFediverseFeatures) {
    items.push({ label: 'Followers', key: '3', children: followersTabContent });
  }

  return (
    <ErrorBoundary
      // eslint-disable-next-line react/no-unstable-nested-components
      fallbackRender={({ error, resetErrorBoundary }) => (
        <ComponentError
          componentName="DesktopContent"
          message={error.message}
          retryFunction={resetErrorBoundary}
        />
      )}
    >
      <div>
        {items.length > 1 ? (
          <Tabs defaultActiveKey="0" items={items} />
        ) : (
          !!extraPageContent && aboutTabContent
        )}
      </div>
    </ErrorBoundary>
  );
};
