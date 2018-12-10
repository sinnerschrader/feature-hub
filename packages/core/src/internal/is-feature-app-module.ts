import {FeatureAppDefinition} from '../feature-app-manager';

export interface FeatureAppModule {
  readonly default: FeatureAppDefinition;
}

function isFeatureAppDefinition(
  // tslint:disable-next-line:no-any
  maybeFeatureAppDefinition: any
): maybeFeatureAppDefinition is FeatureAppDefinition {
  if (
    typeof maybeFeatureAppDefinition !== 'object' ||
    !maybeFeatureAppDefinition
  ) {
    return false;
  }

  const featureAppDefinition = maybeFeatureAppDefinition as FeatureAppDefinition;

  // tslint:disable-next-line:strict-type-predicates
  if (typeof featureAppDefinition.id !== 'string') {
    return false;
  }

  // tslint:disable-next-line:strict-type-predicates no-unbound-method
  return typeof featureAppDefinition.create === 'function';
}

export function isFeatureAppModule(
  // tslint:disable-next-line:no-any
  maybeFeatureAppModule: any
): maybeFeatureAppModule is FeatureAppModule {
  if (typeof maybeFeatureAppModule !== 'object' || !maybeFeatureAppModule) {
    return false;
  }

  return isFeatureAppDefinition(
    (maybeFeatureAppModule as FeatureAppModule).default
  );
}
