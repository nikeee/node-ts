/**
 * Escapes a string so it can be safely used for querying the api.
 * @param  {string} s The string to escape.
 * @return {string}   An escaped string.
 */
export function escapeQueryString(s: string): string {
    let r = String(s);
    r = r.replace(/\\/g, "\\\\");   // Backslash
    r = r.replace(/\//g, "\\/");    // Slash
    r = r.replace(/\|/g, "\\p");    // Pipe
    r = r.replace(/\n/g, "\\n");    // Newline
    r = r.replace(/\r/g, "\\r");    // Carriage Return
    r = r.replace(/\t/g, "\\t");    // Tab
    r = r.replace(/\v/g, "\\v");    // Vertical Tab
    r = r.replace(/\f/g, "\\f");    // Formfeed
    r = r.replace(/ /g, "\\s");    // Whitespace
    return r;
}

/**
 * Unescapes a string so it can be used for processing the response of the api.
 * @param  {string} s The string to unescape.
 * @return {string}   An unescaped string.
 */
export function unescapeQueryString(s: string): string {
    let r = String(s);
    r = r.replace(/\\s/g, " ");	// Whitespace
    r = r.replace(/\\p/g, "|");    // Pipe
    r = r.replace(/\\n/g, "\n");   // Newline
    r = r.replace(/\\f/g, "\f");   // Formfeed
    r = r.replace(/\\r/g, "\r");   // Carriage Return
    r = r.replace(/\\t/g, "\t");   // Tab
    r = r.replace(/\\v/g, "\v");   // Vertical Tab
    r = r.replace(/\\\//g, "\/");   // Slash
    r = r.replace(/\\\\/g, "\\");   // Backslash
    return r;
}
