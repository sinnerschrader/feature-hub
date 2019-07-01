import * as history from 'history';
import {ConsumerLocation, RootHistory} from '..';
import {
  ConsumerHistoryStates,
  RootLocation,
  RootLocationDescriptorObject,
  RootLocationTransformer
} from '../create-root-location-transformer';

export class HistoryMultiplexer {
  public constructor(
    public readonly rootHistory: RootHistory,
    public readonly rootLocationTransformer: RootLocationTransformer
  ) {}

  public get length(): number {
    return this.rootHistory.length;
  }

  public get rootLocation(): RootLocation {
    return this.rootHistory.location;
  }

  public push(
    historyKey: string,
    consumerLocation: history.LocationDescriptorObject
  ): void {
    this.rootHistory.push(
      this.createRootLocation(historyKey, consumerLocation)
    );
  }

  public replace(
    historyKey: string,
    consumerLocation: history.LocationDescriptorObject
  ): void {
    this.rootHistory.replace(
      this.createRootLocation(historyKey, consumerLocation)
    );
  }

  public createHref(
    historyKey: string,
    consumerLocation: history.Location
  ): history.Href {
    return this.rootHistory.createHref(
      this.createRootLocation(historyKey, consumerLocation)
    );
  }

  public getConsumerLocation(historyKey: string): history.Location {
    const consumerPath =
      this.rootLocationTransformer.getConsumerPathFromRootLocation(
        this.rootLocation,
        historyKey
      ) || '/';

    const consumerStates = this.rootLocation.state;
    const consumerState = consumerStates && consumerStates[historyKey];

    return history.createLocation(consumerPath, consumerState);
  }

  public listenForRootLocationChange(
    listener: (action: history.Action) => void
  ): () => void {
    return this.rootHistory.listen((_location, action) => {
      listener(action);
    });
  }

  public createNewRootLocationForMultipleConsumers(
    ...consumerLocations: ConsumerLocation[]
  ): RootLocationDescriptorObject {
    let rootlocation: RootLocationDescriptorObject = {pathname: '/'};

    for (const consumerLocation of consumerLocations) {
      rootlocation = this.createRootLocation(
        consumerLocation.historyKey,
        consumerLocation.location,
        rootlocation
      );
    }

    return rootlocation;
  }

  private createRootLocation(
    historyKey: string,
    consumerLocation: history.LocationDescriptorObject,
    rootLocation: RootLocationDescriptorObject = this.rootLocation
  ): RootLocation {
    const newRootLocation = this.rootLocationTransformer.createRootLocation(
      rootLocation,
      consumerLocation,
      historyKey
    );

    const consumerStates = rootLocation.state;

    const newConsumerStates: ConsumerHistoryStates = {
      ...consumerStates,
      [historyKey]: consumerLocation.state
    };

    return history.createLocation({
      ...newRootLocation,
      state: newConsumerStates
    });
  }
}
