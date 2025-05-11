import { getISOWeek, getISOWeeksInYear, getISOWeekYear, setISOWeekYear, setISOWeek, startOfISOWeek, format } from 'date-fns';
import createAttribute from '@library/attributeselector';

type UXMode = 'continuous' | 'loop' | 'fixed';
type CalendarweekElements = 'component' | 'week' | 'year';
type Action = (week: number, year: number, date: Date) => any;

function getISOWeeksOfYear(year: number): number {
  return getISOWeeksInYear(new Date(year, 5, 1));
}

export class CalendarweekComponent {
  private container: HTMLElement;
  private weekInput: HTMLInputElement;
  private yearInput: HTMLInputElement;
  private week: number;
  private year: number;
  private minDate: Date | null = null;
  private maxDate: Date | null = null;
  private minDateYear: number | null;
  private maxDateYear: number | null;
  private minDateWeek: number | null;
  private maxDateWeek: number | null;
  private currentMinWeek: number;
  private currentMaxWeek: number;
  private mode: UXMode = 'continuous';
  private onChangeActions: Action[] = [];

  constructor(container: HTMLElement, mode?: UXMode) {
    this.container = container;
    this.weekInput = container.querySelector<HTMLInputElement>(CalendarweekComponent.select("week"));
    this.yearInput = container.querySelector<HTMLInputElement>(CalendarweekComponent.select("year"));

    if (!this.weekInput || !this.yearInput) {
      throw new Error(`Couldn't find required "week" or "year" input element. Check the attribute selector "${CalendarweekComponent.select()}"`);
    }

    // Read the mode from a data attribute (defaults to 'continuous' if not set)
    if (!mode) {
      mode = container.getAttribute('data-mode') as UXMode;
      if (!["continuous", "loop", "fixed"].some((validMode) => validMode === mode)) {
        mode = "continuous";
        console.info(`Mode parsed from attribute was invalid. Mode was set to "${mode}".`);
      }
    }

    this.setMode(mode);

    // Read min and max dates from the data attributes
    const minDateStr = container.getAttribute('data-min-date') || '';
    const maxDateStr = container.getAttribute('data-max-date') || '';
    this.setMinMaxDates(new Date(minDateStr), new Date(maxDateStr));
    this.updateWeekMinMax();

    // Bind event listeners
    this.weekInput.addEventListener('keydown', (event) => this.onWeekKeydown(event));
    this.yearInput.addEventListener('keydown', (event) => this.onYearKeydown(event));
    this.weekInput.addEventListener('change', () => this.onWeekChange());
    this.yearInput.addEventListener('change', () => this.onYearChange());
  }

  public static select = createAttribute<CalendarweekElements>('data-cweek-element');

  public setDate(date: Date, silent: boolean = false): void {
    const year = getISOWeekYear(date);
    const week = getISOWeek(date);

    // Ensure that the date is within the valid range (minDate and maxDate)
    if (
      (this.minDate && date < this.minDate) ||
      (this.maxDate && date > this.maxDate)
    ) {
      throw new Error('The provided date is out of range.');
    }

    // Set the year and calendar week
    this.year = year;
    this.week = week;

    // Update the range based on the new year and week
    this.updateWeekMinMax();
    if (!silent) {
      this.onChange();
    } else {
      this.updateClient();
    }
  }

  public setMode(mode: UXMode): void {
    switch (mode) {
      case "continuous":
      case "loop":
      case "fixed":
        this.mode = mode;
        break;
      default:
        throw new Error(`"${mode}" is not a valid mode.`);
    }

    console.info(`Calendarweek: Mode set to "${this.mode}".`);
  }

  public setMinMaxDates(newMinDate: Date | null, newMaxDate: Date | null): void {
    if (newMinDate instanceof Date && !isNaN(newMinDate.getTime())) {
      this.minDate = newMinDate;
      this.minDateYear = getISOWeekYear(newMinDate);
      this.minDateWeek = getISOWeek(newMinDate);
      this.yearInput.min = this.minDateYear.toString();
      this.container.dataset.minDate = format(newMinDate, "yyyy-MM-dd");
    } else {
      this.minDate = null;
      this.minDateYear = null;
      this.minDateWeek = null;
      this.yearInput.min = null;
      this.container.dataset.minDate = null;
    }

    if (newMaxDate instanceof Date && !isNaN(newMaxDate.getTime())) {
      this.maxDate = newMaxDate;
      this.maxDateYear = getISOWeekYear(newMaxDate);
      this.maxDateWeek = getISOWeek(newMaxDate);
      this.yearInput.max = this.maxDateYear.toString();
      this.container.dataset.maxDate = format(newMaxDate, "yyyy-MM-dd");
    } else {
      this.maxDate = null;
      this.maxDateYear = null;
      this.maxDateWeek = null;
      this.yearInput.max = null;
      this.container.dataset.maxDate = null;
    }

    this.updateWeekMinMax();
  }

  public addOnChange(callback: Action): void {
    this.onChangeActions.push(callback);
  }

  public removeOnChange(callback: Action): void {
    this.onChangeActions = this.onChangeActions.filter(fn => fn !== callback);
  }

  public getCurrentDate(): Date {
    // Create a date representing the given ISO year and week
    let date = setISOWeekYear(new Date(0), this.year);
    date = setISOWeek(date, this.week);

    // Get the first day (Monday) of that week
    return startOfISOWeek(date);
  }

  private parseWeekAndYear(): void {
    let parsedYear = parseInt(this.yearInput.value, 10);
    let parsedWeek = parseInt(this.weekInput.value, 10);

    // Ensure year and week are within bounds
    parsedYear = this.keepYearInBounds(parsedYear);
    this.updateWeekMinMax(parsedYear);
    parsedWeek = this.keepWeekInBounds(parsedWeek);

    this.year = parsedYear;
    this.week = parsedWeek;
  }

  private onChange(): void {
    this.updateClient();
    this.onChangeActions.forEach((callback) => callback(this.week, this.year, this.getCurrentDate()));
  }

  private updateClient(): void {
    this.updateClientWeekMinMax();
    this.updateClientValues();
  }

  private updateClientWeekMinMax(): void {
    this.weekInput.min = this.currentMinWeek.toString();
    this.weekInput.max = this.currentMaxWeek.toString();
  }

  private updateClientValues(): void {
    this.yearInput.value = this.year.toString();
    this.weekInput.value = this.week.toString();
  }

  private onYearChange(): void {
    this.parseWeekAndYear();
    this.onChange();
  }

  private onWeekChange(): void {
    this.parseWeekAndYear();
    this.onChange();
  }

  private updateWeekMinMax(currentYear: number = this.year): void {
    const maxWeeksOfCurrentYear = getISOWeeksOfYear(currentYear);
    let minCalendarWeek = 1;
    let maxCalendarWeek = maxWeeksOfCurrentYear;

    if (this.minDate !== null && this.minDateYear === currentYear) {
      minCalendarWeek = this.minDateWeek;
    }

    if (this.maxDate !== null && this.maxDateYear === currentYear) {
      maxCalendarWeek = this.maxDateWeek;
    }

    this.currentMinWeek = minCalendarWeek;
    this.currentMaxWeek = maxCalendarWeek;
  }

  private onWeekKeydown(event: KeyboardEvent): void {
    this.parseWeekAndYear();
    let changed: boolean = false;

    if (event.key === "ArrowUp" && this.week >= this.currentMaxWeek) {
      event.preventDefault();
      switch (this.mode) {
        case "continuous":
          if (this.year === this.maxDateYear) break;
          this.year += 1;
          this.week = 1;
          this.updateWeekMinMax();
          changed = true;
          break;

        case "loop":
          this.week = this.currentMinWeek;
          changed = true;
          break;
      }
    } else if (event.key === "ArrowDown" && this.week <= this.currentMinWeek) {
      event.preventDefault();
      switch (this.mode) {
        case "continuous":
          if (this.year === this.minDateYear) break;
          this.year -= 1;
          this.week = getISOWeeksOfYear(this.year);
          this.updateWeekMinMax();
          changed = true;
          break;

        case "loop":
          this.week = this.currentMaxWeek;
          changed = true;
          break;
      }
    }

    if (changed) {
      this.onChange();
    }
  }

  private keepYearInBounds(year: number): number {
    if (this.minDateYear !== null && year < this.minDateYear) {
      return this.minDateYear;
    }
    if (this.maxDateYear !== null && year > this.maxDateYear) {
      return this.maxDateYear;
    }
    return year;
  }

  private keepWeekInBounds(week: number): number {
    if (week < this.currentMinWeek) {
      return this.currentMinWeek;
    } else if (week > this.currentMaxWeek) {
      return this.currentMaxWeek;
    }
    return week;
  }

  private onYearKeydown(event: KeyboardEvent): void {
    if (this.mode !== "loop" || !this.minDate || !this.maxDate) return;
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

    const isArrowUp = event.key === "ArrowUp";
    const isArrowDown = event.key === "ArrowDown";
    this.parseWeekAndYear();

    if ((isArrowUp && this.year === this.maxDateYear) || (isArrowDown && this.year === this.minDateYear)) {
      event.preventDefault();
      this.year = (isArrowUp ? this.minDateYear : this.maxDateYear);

      this.onChange();
    }
  }
}

