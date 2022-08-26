import { AxiosStatic } from 'axios';

export interface StormGlassAPIPointSource {
  [key: string]: number;
}

export interface StormGlassAPIPoint {
  readonly swellDirection: StormGlassAPIPointSource;
  readonly swellHeight: StormGlassAPIPointSource;
  readonly swellPeriod: StormGlassAPIPointSource;
  readonly time: string;
  readonly waveDirection: StormGlassAPIPointSource;
  readonly waveHeight: StormGlassAPIPointSource;
  readonly windDirection: StormGlassAPIPointSource;
  readonly windSpeed: StormGlassAPIPointSource;
}

export interface StormGlassAPIForecastResponse {
  hours: StormGlassAPIPoint[];
}

export interface ForecastPoint {
  swellDirection: number;
  swellHeight: number;
  swellPeriod: number;
  time: string;
  waveDirection: number;
  waveHeight: number;
  windDirection: number;
  windSpeed: number;
}

export class StormGlass {
  readonly stormGlassAPIParams =
    'swellDirection,swellHeight,swellPeriod,waveDirection,waveHeight,windDirection,windSpeed';
  readonly stormGlassAPISource = 'noaa';

  constructor(protected request: AxiosStatic) {}

  public async fetchPoints(lat: number, lng: number): Promise<ForecastPoint[]> {
    const apiResponse = await this.request.get<StormGlassAPIForecastResponse>(
      `https://api.stormglass.io/v2/weather/point?params=${this.stormGlassAPIParams}&source=${this.stormGlassAPISource}
      &end=1592113802&lat=${lat}&lng=${lng}`
    );

    return this.normalizePointsResponse(apiResponse.data);
  }

  private normalizePointsResponse(
    pointsAPIResponse: StormGlassAPIForecastResponse
  ): ForecastPoint[] {
    return pointsAPIResponse.hours
      .filter(this.isValidAPIPoint.bind(this))
      .map((point) => ({
        swellDirection: point.swellDirection[this.stormGlassAPISource],
        swellHeight: point.swellHeight[this.stormGlassAPISource],
        swellPeriod: point.swellPeriod[this.stormGlassAPISource],
        time: point.time,
        waveDirection: point.waveDirection[this.stormGlassAPISource],
        waveHeight: point.waveHeight[this.stormGlassAPISource],
        windDirection: point.windDirection[this.stormGlassAPISource],
        windSpeed: point.windSpeed[this.stormGlassAPISource],
      }));
  }

  private isValidAPIPoint(point: Partial<StormGlassAPIPoint>): boolean {
    return !!(
      point.swellDirection?.[this.stormGlassAPISource] &&
      point.swellHeight?.[this.stormGlassAPISource] &&
      point.swellPeriod?.[this.stormGlassAPISource] &&
      point.time &&
      point.waveHeight?.[this.stormGlassAPISource] &&
      point.windDirection?.[this.stormGlassAPISource] &&
      point.windSpeed?.[this.stormGlassAPISource]
    );
  }
}
