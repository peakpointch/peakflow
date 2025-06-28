import { getISOWeek, getISOWeeksInYear, getISOWeekYear, setISOWeekYear, setISOWeek, startOfISOWeek, format } from 'date-fns';
import createAttribute from '../attributeselector/index.js';
function getISOWeeksOfYear(year) {
    return getISOWeeksInYear(new Date(year, 5, 1));
}
export class CalendarweekComponent {
    constructor(container, mode) {
        this.minDate = null;
        this.maxDate = null;
        this.mode = 'continuous';
        this.onChangeActions = [];
        this.container = container;
        const weekInput = container.querySelector(CalendarweekComponent.select("week"));
        const yearInput = container.querySelector(CalendarweekComponent.select("year"));
        if (!weekInput || !yearInput) {
            throw new Error(`Couldn't find required "week" or "year" input element. Check the attribute selector "${CalendarweekComponent.select()}"`);
        }
        this.weekInput = weekInput;
        this.yearInput = yearInput;
        // Read the mode from a data attribute (defaults to 'continuous' if not set)
        if (!mode) {
            mode = container.getAttribute('data-mode');
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
    setDate(date, silent = false) {
        const year = getISOWeekYear(date);
        const week = getISOWeek(date);
        // Ensure that the date is within the valid range (minDate and maxDate)
        if ((this.minDate && date < this.minDate) ||
            (this.maxDate && date > this.maxDate)) {
            throw new Error('The provided date is out of range.');
        }
        // Set the year and calendar week
        this.year = year;
        this.week = week;
        // Update the range based on the new year and week
        this.updateWeekMinMax();
        if (!silent) {
            this.onChange();
        }
        else {
            this.updateClient();
        }
    }
    setMode(mode) {
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
    setMinMaxDates(newMinDate, newMaxDate) {
        if (newMinDate instanceof Date && !isNaN(newMinDate.getTime())) {
            this.minDate = newMinDate;
            this.minDateYear = getISOWeekYear(newMinDate);
            this.minDateWeek = getISOWeek(newMinDate);
            this.yearInput.min = this.minDateYear.toString();
            this.container.dataset.minDate = format(newMinDate, "yyyy-MM-dd");
        }
        else {
            this.minDate = null;
            this.minDateYear = null;
            this.minDateWeek = null;
            this.yearInput.min = '';
            this.container.dataset.minDate = '';
        }
        if (newMaxDate instanceof Date && !isNaN(newMaxDate.getTime())) {
            this.maxDate = newMaxDate;
            this.maxDateYear = getISOWeekYear(newMaxDate);
            this.maxDateWeek = getISOWeek(newMaxDate);
            this.yearInput.max = this.maxDateYear.toString();
            this.container.dataset.maxDate = format(newMaxDate, "yyyy-MM-dd");
        }
        else {
            this.maxDate = null;
            this.maxDateYear = null;
            this.maxDateWeek = null;
            this.yearInput.max = '';
            this.container.dataset.maxDate = '';
        }
        this.updateWeekMinMax();
    }
    addOnChange(callback) {
        this.onChangeActions.push(callback);
    }
    removeOnChange(callback) {
        this.onChangeActions = this.onChangeActions.filter(fn => fn !== callback);
    }
    getCurrentDate() {
        // Create a date representing the given ISO year and week
        let date = setISOWeekYear(new Date(0), this.year);
        date = setISOWeek(date, this.week);
        // Get the first day (Monday) of that week
        return startOfISOWeek(date);
    }
    parseWeekAndYear() {
        let parsedYear = parseInt(this.yearInput.value, 10);
        let parsedWeek = parseInt(this.weekInput.value, 10);
        // Ensure year and week are within bounds
        parsedYear = this.keepYearInBounds(parsedYear);
        this.updateWeekMinMax(parsedYear);
        parsedWeek = this.keepWeekInBounds(parsedWeek);
        this.year = parsedYear;
        this.week = parsedWeek;
    }
    onChange() {
        this.updateClient();
        this.onChangeActions.forEach((callback) => callback(this.week, this.year, this.getCurrentDate()));
    }
    updateClient() {
        this.updateClientWeekMinMax();
        this.updateClientValues();
    }
    updateClientWeekMinMax() {
        this.weekInput.min = this.currentMinWeek.toString();
        this.weekInput.max = this.currentMaxWeek.toString();
    }
    updateClientValues() {
        this.yearInput.value = this.year.toString();
        this.weekInput.value = this.week.toString();
    }
    onYearChange() {
        this.parseWeekAndYear();
        this.onChange();
    }
    onWeekChange() {
        this.parseWeekAndYear();
        this.onChange();
    }
    updateWeekMinMax(currentYear = this.year) {
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
    onWeekKeydown(event) {
        this.parseWeekAndYear();
        let changed = false;
        if (event.key === "ArrowUp" && this.week >= this.currentMaxWeek) {
            event.preventDefault();
            switch (this.mode) {
                case "continuous":
                    if (this.year === this.maxDateYear)
                        break;
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
        }
        else if (event.key === "ArrowDown" && this.week <= this.currentMinWeek) {
            event.preventDefault();
            switch (this.mode) {
                case "continuous":
                    if (this.year === this.minDateYear)
                        break;
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
    keepYearInBounds(year) {
        if (this.minDateYear !== null && year < this.minDateYear) {
            return this.minDateYear;
        }
        if (this.maxDateYear !== null && year > this.maxDateYear) {
            return this.maxDateYear;
        }
        return year;
    }
    keepWeekInBounds(week) {
        if (week < this.currentMinWeek) {
            return this.currentMinWeek;
        }
        else if (week > this.currentMaxWeek) {
            return this.currentMaxWeek;
        }
        return week;
    }
    onYearKeydown(event) {
        if (this.mode !== "loop" || !this.minDate || !this.maxDate)
            return;
        if (event.key !== "ArrowUp" && event.key !== "ArrowDown")
            return;
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
CalendarweekComponent.select = createAttribute('data-cweek-element');
