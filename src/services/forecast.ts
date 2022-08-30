import { ForecastPoint, StormGlass } from '@src/clients/stormGlass';

export enum BeachPosition {
  S = 'S',
  E = 'E',
  W = 'W',
  N = 'N',
}

export interface Beach {
  name: string;
  position: BeachPosition;
  lat: number;
  lng: number;
  user: string;
}

export interface TimeGroupedForecast {
  time: string;
  forecast: BeachForecast[];
}

export interface BeachForecast extends Omit<Beach, 'user'>, ForecastPoint {}

export class Forecast {
  constructor(protected stormGlassClient = new StormGlass()) {}

  public async processForecastForBeaches(
    beaches: Beach[]
  ): Promise<TimeGroupedForecast[]> {
    const pointsWithCorrectSources: BeachForecast[] = [];

    for (const beach of beaches) {
      const points = await this.stormGlassClient.fetchPoints(
        beach.lat,
        beach.lng
      );
      const enrichedBeachData = points.map((point) => ({
        ...{
          name: beach.name,
          position: beach.position,
          lat: beach.lat,
          lng: beach.lng,
          rating: 1,
        },
        ...point,
      }));

      pointsWithCorrectSources.push(...enrichedBeachData);
    }

    return this.mapForecastByTime(pointsWithCorrectSources);
  }

  private mapForecastByTime(forecasts: BeachForecast[]): TimeGroupedForecast[] {
    const timeGroupedForecast: TimeGroupedForecast[] = [];

    for (const forecast of forecasts) {
      const existingTimeGroup = timeGroupedForecast.find(
        (timeGroup) => timeGroup.time === forecast.time
      );
      if (existingTimeGroup) {
        existingTimeGroup.forecast.push(forecast);
      } else {
        timeGroupedForecast.push({ time: forecast.time, forecast: [forecast] });
      }
    }

    return timeGroupedForecast;
  }
}
