import {
  FeatureServiceConsumerDefinition,
  FeatureServiceConsumerEnvironment,
  FeatureServiceProviderDefinition,
  FeatureServiceRegistryLike
} from '@feature-hub/feature-service-registry';
import {AsyncValue} from './async-value';
import {isFeatureAppModule} from './internal/is-feature-app-module';

export interface FeatureAppDefinition<TFeatureApp>
  extends FeatureServiceConsumerDefinition {
  ownFeatureServiceProviderDefinitions?: FeatureServiceProviderDefinition[];

  create(env: FeatureServiceConsumerEnvironment): TFeatureApp;
}

export interface FeatureAppModule<TFeatureApp> {
  default: FeatureAppDefinition<TFeatureApp>;
}

/**
 * @return It should resolve with a {@link FeatureAppModule}.
 */
export type FeatureAppModuleLoader = (
  featureAppUrl: string
) => Promise<unknown>;

export interface FeatureAppScope<TFeatureApp> {
  featureApp: TFeatureApp;

  destroy(): void;
}

export interface FeatureAppManagerLike {
  getAsyncFeatureAppDefinition(
    featureAppUrl: string
  ): AsyncValue<FeatureAppDefinition<unknown>>;

  getFeatureAppScope(
    featureAppDefinition: FeatureAppDefinition<unknown>,
    featureAppKey?: string
  ): FeatureAppScope<unknown>;

  preloadFeatureApp(featureAppUrl: string): Promise<void>;
  destroy(): void;
}

type FeatureAppUrl = string;
type FeatureAppScopeId = string;

export class FeatureAppManager implements FeatureAppManagerLike {
  private readonly asyncFeatureAppDefinitions = new Map<
    FeatureAppUrl,
    AsyncValue<FeatureAppDefinition<unknown>>
  >();

  private readonly ownFeatureServiceProvidersRegistered = new WeakSet<
    FeatureAppDefinition<unknown>
  >();

  private readonly featureAppScopes = new Map<
    FeatureAppScopeId,
    FeatureAppScope<unknown>
  >();

  public constructor(
    private readonly featureServiceRegistry: FeatureServiceRegistryLike,
    private readonly loadFeatureAppModule: FeatureAppModuleLoader
  ) {}

  public getAsyncFeatureAppDefinition(
    featureAppUrl: string
  ): AsyncValue<FeatureAppDefinition<unknown>> {
    let asyncFeatureAppDefinition = this.asyncFeatureAppDefinitions.get(
      featureAppUrl
    );

    if (!asyncFeatureAppDefinition) {
      asyncFeatureAppDefinition = this.createAsyncFeatureAppDefinition(
        featureAppUrl
      );

      this.asyncFeatureAppDefinitions.set(
        featureAppUrl,
        asyncFeatureAppDefinition
      );
    }

    return asyncFeatureAppDefinition;
  }

  public getFeatureAppScope(
    featureAppDefinition: FeatureAppDefinition<unknown>,
    featureAppKey?: string
  ): FeatureAppScope<unknown> {
    const {id: featureAppId} = featureAppDefinition;
    const featureAppScopeId = JSON.stringify({featureAppId, featureAppKey});

    let featureAppScope = this.featureAppScopes.get(featureAppScopeId);

    if (!featureAppScope) {
      this.registerOwnFeatureServiceProviders(featureAppDefinition);

      const deleteFeatureAppScope = () =>
        this.featureAppScopes.delete(featureAppScopeId);

      featureAppScope = this.createFeatureAppScope(
        featureAppDefinition,
        featureAppKey,
        deleteFeatureAppScope
      );

      this.featureAppScopes.set(featureAppScopeId, featureAppScope);
    }

    return featureAppScope;
  }

  public async preloadFeatureApp(featureAppUrl: string): Promise<void> {
    await this.getAsyncFeatureAppDefinition(featureAppUrl).promise;
  }

  public destroy(): void {
    for (const featureAppScope of this.featureAppScopes.values()) {
      featureAppScope.destroy();
    }
  }

  private createAsyncFeatureAppDefinition(
    featureAppUrl: string
  ): AsyncValue<FeatureAppDefinition<unknown>> {
    return new AsyncValue(
      this.loadFeatureAppModule(featureAppUrl).then(featureAppModule => {
        if (!isFeatureAppModule(featureAppModule)) {
          throw new Error(
            `The feature app module at url ${JSON.stringify(
              featureAppUrl
            )} is invalid. A feature app module must have a feature app definition as default export. A feature app definition is an object with at least an \`id\` string and a \`create\` method.`
          );
        }

        console.info(
          `The feature app module for the url ${JSON.stringify(
            featureAppUrl
          )} has been successfully loaded.`
        );

        return featureAppModule.default;
      })
    );
  }

  private registerOwnFeatureServiceProviders(
    featureAppDefinition: FeatureAppDefinition<unknown>
  ): void {
    if (this.ownFeatureServiceProvidersRegistered.has(featureAppDefinition)) {
      return;
    }

    if (featureAppDefinition.ownFeatureServiceProviderDefinitions) {
      this.featureServiceRegistry.registerProviders(
        featureAppDefinition.ownFeatureServiceProviderDefinitions,
        featureAppDefinition.id
      );
    }

    this.ownFeatureServiceProvidersRegistered.add(featureAppDefinition);
  }

  private createFeatureAppScope(
    featureAppDefinition: FeatureAppDefinition<unknown>,
    featureAppKey: string | undefined,
    deleteFeatureAppScope: () => void
  ): FeatureAppScope<unknown> {
    const featureServiceBindings = this.featureServiceRegistry.bindFeatureServices(
      featureAppDefinition,
      featureAppKey
    );

    const featureApp = featureAppDefinition.create(
      featureServiceBindings.consumerEnvironment
    );

    console.info(
      `The feature app scope for the id ${JSON.stringify(
        featureAppDefinition.id
      )} and the key ${JSON.stringify(
        featureAppKey
      )} has been successfully created.`
    );

    let destroyed = false;

    const destroy = () => {
      if (destroyed) {
        throw new Error(
          `The feature app scope for the id ${JSON.stringify(
            featureAppDefinition.id
          )} and the key ${JSON.stringify(
            featureAppKey
          )} could not be destroyed.`
        );
      }

      deleteFeatureAppScope();
      featureServiceBindings.unbind();

      destroyed = true;
    };

    return {featureApp, destroy};
  }
}
