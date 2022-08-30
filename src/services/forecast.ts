import { ForecastPoint, StormGlass } from '@src/clients/stormGlass';
import { InternalError } from '@src/util/errors/internal-error';

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

export interface BeachForecast extends Omit<Beach, 'user'>, ForecastPoint {}

export interface TimeGroupedForecast {
  time: string;
  forecast: BeachForecast[];
}

export class ForecastProcessingInternalError extends InternalError {
  constructor(message: string) {
    super(`Unexpected error during the forecast processing: ${message}`);
  }
}

export class Forecast {
  constructor(protected stormGlassClient = new StormGlass()) {}

  public async processForecastForBeaches(
    beaches: Beach[]
  ): Promise<TimeGroupedForecast[]> {
    const pointsWithCorrectSources: BeachForecast[] = [];

    try {
      for (const beach of beaches) {
        const points = await this.stormGlassClient.fetchPoints(
          beach.lat,
          beach.lng
        );
        const enrichedBeachData = this.enrichBeachData(beach, points);

        pointsWithCorrectSources.push(...enrichedBeachData);
      }

      return this.mapForecastByTime(pointsWithCorrectSources);
    } catch (err) {
      throw new ForecastProcessingInternalError(
        (err as { message: string }).message
      );
    }
  }

  private enrichBeachData(
    beach: Beach,
    points: ForecastPoint[]
  ): BeachForecast[] {
    return points.map((point) => ({
      ...{
        name: beach.name,
        position: beach.position,
        lat: beach.lat,
        lng: beach.lng,
        rating: 1,
      },
      ...point,
    }));
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
