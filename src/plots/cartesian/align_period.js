/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');
var ms2DateTime = require('../../lib').ms2DateTime;
var constants = require('../../constants/numerical');
var ONEDAY = constants.ONEDAY;

module.exports = function alignPeriod(trace, ax, axLetter, vals) {
    var alignment = trace[axLetter + 'periodalignment'];
    if(!alignment || alignment === 'start') return vals;

    var dynamic = false;
    var period = trace[axLetter + 'period'];
    if(isNumeric(period)) {
        period = +period; // milliseconds
        if(period <= 0) return vals;
    } else if(typeof period === 'string' && period.charAt(0) === 'M') {
        var v = +(period.substring(1));
        if(v > 0 && Math.round(v) === v) period = v; // positive integer months
        else return vals;

        dynamic = true;
    }

    if(period > 0) {
        var isStart = 'start' === alignment;
        var isMiddle = 'middle' === alignment;
        var isEnd = 'end' === alignment;

        var len = vals.length;
        for(var i = 0; i < len; i++) {
            var v0 = vals[i];

            var dateStr0 = ms2DateTime(v0, 0, ax.calendar);
            var d0 = new Date(dateStr0);
            d0 = new Date(d0.getTime() + d0.getTimezoneOffset() * 60000);
            var year0 = d0.getFullYear();
            var month0 = d0.getMonth();
            var day0 = d0.getDate();

            var delta;
            if(dynamic) {
                var y = year0;
                var m = month0;

                // calculate the number of days in the following months
                var totalDaysInMonths = 0;
                for(var k = 0; k < period; k++) {
                    m += 1;
                    if(m > 12) {
                        m = 1;
                        y++;
                    }

                    var daysOfMonth = (
                        new Date(y, m, 0)
                    ).getDate();

                    totalDaysInMonths += daysOfMonth;
                }

                delta = ONEDAY * totalDaysInMonths; // convert to ms
            } else {
                delta = period;
            }

            var v2 = v0 + delta;

            var dateStr2 = ms2DateTime(v2, 0, ax.calendar);
            var d2 = new Date(dateStr2);
            d2 = new Date(d2.getTime() + d2.getTimezoneOffset() * 60000);
            var year2 = d2.getFullYear();
            var month2 = d2.getMonth();
            var day2 = d2.getDate();

            var year1 = (year0 + year2) / 2;
            var month1 = (month0 + month2) / 2;
            var day1 = (day0 + day2) / 2;

            var rYear = Math.floor(year1);
            if(rYear > year1) {
                month1 += (year1 - rYear) * 12;
                year1 = rYear;
            }

            var rMonth = Math.floor(month1);
            if(rMonth > month1) {
                day1 += (month1 - rMonth) * 15;
                month1 = rMonth;
            }

            day1 = Math.floor(day1);

            console.log('year:', year0, year1, year2)
            console.log('month:', month0, month1, month2)
            console.log('day:', day0, day1, day2)

            var d1;
            if(year2 === year0 + 1 && month2 === month0) {
                if(isStart) {
                    d1 = new Date(year1, 0, 1);
                } else if(isEnd) {
                    d1 = new Date(year1, 11, 31);
                } else { // isMiddle
                    d1 = new Date(year1, 6, 1);
                }
            } else if(year2 === year0 && month2 === month0 + 1) {
                var alignDay = isStart ? 1 : (
                    new Date(year1, month1 + 1, 0)
                ).getDate();
                if(isMiddle) alignDay = Math.floor(0.5 + 0.5 * alignDay);

                d1 = new Date(year1, month1, alignDay);
            } else {
                d1 = new Date(year1, month1, day1);
            }

            console.log(d1)

            vals[i] = d1.getTime();
        }
    }
    return vals;
};
