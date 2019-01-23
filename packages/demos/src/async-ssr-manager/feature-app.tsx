import {Card, Label} from '@blueprintjs/core';
import {AsyncSsrManagerV0} from '@feature-hub/async-ssr-manager';
import {FeatureAppDefinition} from '@feature-hub/core';
import {ReactFeatureApp} from '@feature-hub/react';
import {SerializedStateManagerV0} from '@feature-hub/serialized-state-manager';
import * as React from 'react';

interface Dependencies {
  's2:async-ssr-manager': AsyncSsrManagerV0 | undefined;
  's2:serialized-state-manager': SerializedStateManagerV0;
}

async function fetchSubject(): Promise<string> {
  return 'Universe';
}

const featureAppDefinition: FeatureAppDefinition<
  ReactFeatureApp,
  undefined,
  Dependencies
> = {
  id: 'test:hello-world',

  dependencies: {
    's2:serialized-state-manager': '^0.1'
  },

  optionalDependencies: {
    's2:async-ssr-manager': '^0.1'
  },

  create: env => {
    let subject = 'World';

    const asyncSsrManager = env.featureServices['s2:async-ssr-manager'];

    const serializedStateManager =
      env.featureServices['s2:serialized-state-manager'];

    serializedStateManager.register(() => subject);

    const serializedSubject = serializedStateManager.getSerializedState();

    if (asyncSsrManager) {
      asyncSsrManager.rerenderAfter(
        (async () => (subject = await fetchSubject()))()
      );
    } else if (serializedSubject) {
      subject = serializedSubject;
    }

    return {
      render: () => (
        <Card style={{margin: '20px'}}>
          <Label>Hello, {subject}!</Label>
        </Card>
      )
    };
  }
};

export default featureAppDefinition;
