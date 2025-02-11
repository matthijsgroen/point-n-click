/**
 * Content flow
 *
 * Getting from a state to a list of content,
 * and possible interactions to perform
 *
 */

/**
 * Flow of the 'point-n-click' version ('describeLocation')
 *
 * # DescribeLocation
 *
 * - Get the current location
 * - Get the previous location
 * - If the current location is different from the previous location
 *   - Run the 'onLeave' script of the previous location
 *   - Update the previous location
 *   - Run the 'onEnter' script of the current location
 * - Run the 'describe' script of the current location
 * - Update the previous location
 *
 * - Get the current overlay
 * - Run the 'onEnter' script of the current overlay
 *
 *
 * # GetDisplayInfo
 *
 * - If interaction is set
 * - Get the interaction data (from global or local overlay / location)
 * - Run the interaction script
 *
 * - If the interaction script changes the overlay
 *   - Run the 'onLeave' script of the current overlay
 *   - Update the current overlay
 * - If there is still an overlay set (not undefined)
 *   - Run the 'onEnter' script of the new overlay
 * - If there is no overlay set (and overlay was set before)
 *   - Describe the location (#DescribeLocation)
 *
 * - If location has changed and was not yet described
 *   - Describe the location (#DescribeLocation)
 *
 * - If no interaction is set
 *  - Describe the location (#DescribeLocation)
 *
 */
