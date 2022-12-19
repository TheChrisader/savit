export interface SavitI {
  name: string;
}

export class Savit implements SavitI {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}
