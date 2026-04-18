/**
 * Centralized date utilities for parsing and formatting dates
 * consistent across the application.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Safely parse various date formats into a Date object
 * Supported: "YYYY-MM-DD", "DD/MM/YYYY", "DD-MMM-YY", ISO strings
 */
const parseDate = (value) => {
    if (!value) return null;

    // If already a date object
    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value;
    }

    const str = value.toString().trim();

    // Handle DD/MM/YYYY or DD-MM-YYYY
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(str)) {
        const parts = str.split(/[\/\-]/);
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }

    // Handle DD-MMM-YY (e.g., 19-Jan-25)
    if (/^\d{1,2}-[A-Za-z]{3}-\d{2}$/.test(str)) {
        const parts = str.split('-');
        const day = parseInt(parts[0]);
        const monthIndex = MONTHS.indexOf(parts[1]);
        let year = parseInt(parts[2]);
        if (year < 100) year += 2000;

        if (monthIndex !== -1) {
            return new Date(year, monthIndex, day);
        }
    }

    // Standard JS parsing for ISO and others
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
};

/**
 * Parse service period string "DD/MM/YYYY - DD/MM/YYYY" or just "DD/MM/YYYY"
 */
const parseServicePeriod = (periodStr) => {
    if (!periodStr) return { start: null, end: null };

    if (periodStr.includes(' - ')) {
        const [startStr, endStr] = periodStr.split(' - ');
        return {
            start: parseDate(startStr),
            end: parseDate(endStr)
        };
    }

    const d = parseDate(periodStr);
    return { start: d, end: d }; // If single date, treat it as both for safety
};

/**
 * Format date to DD/MM/YYYY
 */
const formatToDMY = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Format date to ISO (YYYY-MM-DD)
 */
const formatToISO = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    // Use local components to avoid UTC shift
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

module.exports = {
    parseDate,
    parseServicePeriod,
    formatToDMY,
    formatToISO
};
