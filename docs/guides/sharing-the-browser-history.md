---
id: sharing-the-browser-history
title: Sharing the Browser History
sidebar_label: Sharing the Browser History
---

When multiple Feature Apps coexist on the same page, they shouldn't access the
[browser history API][browser-history-api] directly. Otherwise, they would
potentially overwrite their respective history and location changes. To enable a
save access to the history for multiple consumers, the
`@feature-hub/history-service` can be used.

## Using the History Service

The History Service combines multiple consumer histories (and their locations)
into a single one. It does this by merging all registered consumer locations
into one, and persisting this combined root location on the history stack. As
long as the consumer performs all history and location interactions through the
history it obtained from the History Service, the existence of the facade and
other consumers isn't noticeable for the consumer. For example, the consumer
receives history change events only for location changes that affect its own
history.

### As a Consumer

In the browser:

```js
import {Router} from 'react-router';

export default {
  id: 'acme:my-feature-app',

  dependencies: {
    's2:history': '^1.0'
  },

  create(env) {
    const historyService = env.featureServices['s2:history'];
    const browserHistory = historyService.createBrowserHistory();

    return {
      render: () => (
        <Router history={browserHistory}>
          <App />
        </Router>
      )
    };
  }
};
```

On the server:

```js
import {Router} from 'react-router';

export default {
  id: 'acme:my-feature-app',

  dependencies: {
    's2:history': '^1.0'
  },

  create(env) {
    const historyService = env.featureServices['s2:history'];
    const staticHistory = historyService.createStaticHistory();

    return {
      render: () => (
        <Router history={staticHistory}>
          <App />
        </Router>
      )
    };
  }
};
```

For both the browser and the static history, the service is API-compatible with
the history package. Note, however, that the `go`, `goBack`, `goForward` and
`block` methods are not supported. For further information, reference [its
documentation][history-npm].

### As the Integrator

The integrator defines the History Service with a [location
transformer][building-the-root-location] and registers it at the Feature Service
registry:

```js
// In the browser:
import {FeatureServiceRegistry} from '@feature-hub/core';
import {
  defineHistoryService,
  createRootLocationTransformer
} from '@feature-hub/history-service';
import {defineServerRenderer} from '@feature-hub/server-renderer';

const registry = new FeatureServiceRegistry();

const rootLocationTransformer = createRootLocationTransformer({
  consumerPathsQueryParamName: '---'
});

const featureServiceDefinitions = [
  defineHistoryService(rootLocationTransformer),
  defineServerRenderer()
];

registry.registerProviders(featureServiceDefinitions, 'integrator');
```

On the server, the integrator defines the server renderer with a request. The
History Service depends on the server renderer to obtain its request and use it
for the initial history location:

```js
// On the server:
import {FeatureServiceRegistry} from '@feature-hub/core';
import {
  defineHistoryService,
  createRootLocationTransformer
} from '@feature-hub/history-service';
import {defineServerRenderer} from '@feature-hub/server-renderer';

const registry = new FeatureServiceRegistry();

const rootLocationTransformer = createRootLocationTransformer({
  consumerPathsQueryParamName: '---'
});

const request = {
  // ... obtain the request from somewhere, e.g. a request handler
};

const featureServiceDefinitions = [
  defineHistoryService(rootLocationTransformer),
  defineServerRenderer(request)
];

registry.registerProviders(featureServiceDefinitions, 'integrator');
```

## Building the Root Location

How the root location is build from the consumer locations, is a problem that
can not be solved generally, since it is dependant on the usecase. This is why
the integrator defines the service with a so-called location transformer. The
location transformer provides functions for merging consumer locations into a
root location, and for extracting a consumer path from the root location.

For a quick out-of-the-box experience, this package also provides a location
transformer ready for use. The included location transformer has the concept of
a primary consumer. Only the primary's location (pathname and query) will get
inserted directly into the root location. All other consumer locations are
encoded into a json string which will be assigned to a single configurable query
parameter.

### Writing a Custom Location Transformer

A location transformer is an object exposing two functions,
`getConsumerPathFromRootLocation` and `createRootLocation`. In the following
example, each consumer location is encoded as its own query parameter, with the
unique consumer ID used as parameter name:

```js
import * as history from 'history';

// ...

const rootLocationTransformer = {
  getConsumerPathFromRootLocation(rootLocation, consumerId) {
    const searchParams = new URLSearchParams(rootLocation.search);

    return searchParams.get(consumerId);
  },

  createRootLocation(consumerLocation, rootLocation, consumerId) {
    const searchParams = new URLSearchParams(rootLocation.search);

    if (consumerLocation) {
      searchParams.set(consumerId, history.createPath(consumerLocation));
    } else {
      searchParams.delete(consumerId);
    }

    const {pathname, state} = rootLocation;

    return {
      pathname,
      search: searchParams.toString(),
      state
    };
  }
};

// ...
```

## Running the Demo

There is a demo that simulates the capabilities of the History Service with two
Feature Apps. Go to the monorepo top-level directory and install all
dependencies:

```sh
yarn
```

Now run the demo:

```sh
yarn watch:demo history-service
```

## Caveats

### Replace & Pop

Since multiple consumers can push and replace location changes at any time onto
the browser history, special attention must be given when **replacing** consumer
locations. Imagine the following scenario with two History Service consumers (A
and B):

- A and B are initially loaded with `/`.

  | Browser History Stack | Current URL |
  | --------------------- | ----------- |
  | /?a=**/**&b=**/**     | ⬅️          |

* A pushes `/a1`, e.g. caused by user interaction.

  | Browser History Stack | Current URL |
  | --------------------- | ----------- |
  | /?a=/&b=/             |             |
  | /?a=**/a1**&b=/       | ⬅️          |

* B decides it needs to replace `/` with `/b1`, e.g. because it received some
  outdated data.

  | Browser History Stack | Current URL |
  | --------------------- | ----------- |
  | /?a=/&b=/             |             |
  | /?a=/a1&b=**/b1**     | ⬅️          |

* The user navigates back.

  | Browser History Stack | Current URL |
  | --------------------- | ----------- |
  | /?a=/&b=/             | ⬅️          |
  | /?a=/a1&b=/b1         |             |

* ⚠️ Now it is B's responsibility, again, to replace its location with `/b1` on
  the first browser history entry.

  | Browser History Stack | Current URL |
  | --------------------- | ----------- |
  | /?a=/&b=**/b1**       | ⬅️          |
  | /?a=/a1&b=/b1         |             |

**Note:** The alternating background colors of the table rows don't have any
meaning.

### Push, Push & Pop

When a History Service consumer pushes the same location multiple times in a row
and the user subsequently navigates back, no pop event is emitted for the
unchanged location of this consumer.

[browser-history-api]: https://developer.mozilla.org/en-US/docs/Web/API/History
[building-the-root-location]:
  /docs/guides/sharing-the-browser-history#building-the-root-location
[history-npm]: https://www.npmjs.com/package/history