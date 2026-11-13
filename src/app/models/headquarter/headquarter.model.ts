export interface Headquarter {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
}

export interface HeadquarterPayload {
  name: string;
  address: string;
  isActive: boolean;
}
