import {FeatureServices} from '@feature-hub/core';
import {FeatureAppContainer} from '@feature-hub/react';
import * as React from 'react';
import featureAppDefinition from './feature-app';

export interface AppProps {
  readonly beforeCreate?: (
    featureAppId: string,
    featureServices: FeatureServices
  ) => void;
}

export function App({beforeCreate}: AppProps): JSX.Element {
  return (
    <>
      <FeatureAppContainer
        featureAppDefinition={featureAppDefinition}
        featureAppId="test:logging-app:first"
        beforeCreate={beforeCreate}
      />
      <FeatureAppContainer
        featureAppDefinition={featureAppDefinition}
        featureAppId="test:logging-app:second"
        beforeCreate={beforeCreate}
      />
    </>
  );
}
