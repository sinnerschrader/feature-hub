import {
  AsyncSsrManagerV1,
  defineAsyncSsrManager
} from '@feature-hub/async-ssr-manager';
import {FeatureAppManager, FeatureServiceRegistry} from '@feature-hub/core';
import {loadCommonJsModule} from '@feature-hub/module-loader-commonjs';
import {FeatureAppLoader} from '@feature-hub/react';
import * as React from 'react';
import * as ReactDOM from 'react-dom/server';

export default async function renderMainHtml(port: number): Promise<string> {
  const featureAppNodeUrl = `http://localhost:${port}/feature-app.commonjs.js`;
  const featureServiceRegistry = new FeatureServiceRegistry();

  const integratorDefinition = {
    id: 'integrator',
    dependencies: {
      's2:async-ssr-manager': '1.0'
    }
  };

  featureServiceRegistry.registerFeatureServices(
    [defineAsyncSsrManager(undefined)],
    integratorDefinition.id
  );

  const {featureServices} = featureServiceRegistry.bindFeatureServices(
    integratorDefinition
  );

  const asyncSsrManager = featureServices[
    's2:async-ssr-manager'
  ] as AsyncSsrManagerV1;

  const featureAppManager = new FeatureAppManager(featureServiceRegistry, {
    moduleLoader: loadCommonJsModule
  });

  await featureAppManager.preloadFeatureApp(featureAppNodeUrl);

  return asyncSsrManager.renderUntilCompleted(() =>
    ReactDOM.renderToString(
      <FeatureAppLoader
        asyncSsrManager={asyncSsrManager}
        featureAppManager={featureAppManager}
        src=""
        serverSrc={featureAppNodeUrl}
      />
    )
  );
}
