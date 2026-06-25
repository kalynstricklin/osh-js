/***************************** BEGIN LICENSE BLOCK ***************************
 The contents of this file are subject to the Mozilla Public License, v. 2.0.
 If a copy of the MPL was not distributed with this file, You can obtain one
 at http://mozilla.org/MPL/2.0/.
 Software distributed under the License is distributed on an "AS IS" basis,
 WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 for the specific language governing rights and limitations under the License.
 Copyright (C) 2015-2022 Mathieu Dhainaut. All Rights Reserved.
 Author: Mathieu Dhainaut <mathieu.dhainaut@gmail.com>
 ******************************* END LICENSE BLOCK ***************************/

import {Chart, registerables} from 'chart.js';
import {assertDefined, isDefined, merge, randomUUID} from '../../../../utils/Utils.js';

/**
 * Chart.js line-chart visualizer for RF/signal spectrum data.
 * Renders frequency (X, in MHz) vs amplitude (Y, in dBFS).
 * Each draw() call replaces the dataset entirely — spectrum is a snapshot, not a time series.
 * No Web Audio AnalyserNode is used; data arrives pre-analyzed from SpectrumDataLayer.
 *
 * @example
 *
 import SpectrumChartJsVisualizer from 'osh-js/core/ui/view/spectrum/visualizer/SpectrumChartJsVisualizer';

 const visualizer = new SpectrumChartJsVisualizer({
     container: 'spectrum-chart-div',
     datasetOptions: { borderColor: '#00e5ff', borderWidth: 1 },
 });
 */
class SpectrumChartJsVisualizer {

    /**
     * Create a SpectrumChartJsVisualizer.
     * @param {Object} properties
     * @param {string} properties.container - DOM element id to append the canvas to (required)
     * @param {string} [properties.css=''] - CSS class(es) to set on the canvas element
     * @param {Object} [properties.options={}] - Chart.js options to merge with defaults
     * @param {Object} [properties.datasetOptions={}] - Chart.js dataset property overrides
     */
    constructor(properties) {
        assertDefined(properties && properties.container, 'container must be defined in constructor argument');
        this.properties = {
            css: '',
            ...properties,
        };
        this.id = randomUUID();
        this.resetting = false;
        this.initChart(properties);
    }

    initChart(properties) {
        Chart.register(...registerables);

        const domNode = document.getElementById(properties.container);
        this.canvas = document.createElement('canvas');

        if (this.properties.css) {
            this.canvas.setAttribute('class', this.properties.css);
        }

        domNode.appendChild(this.canvas);

        this.options = {
            maintainAspectRatio: false,
            animation: false,
            normalized: true,
            spanGaps: true,
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Frequency (MHz)',
                    },
                    ticks: {
                        callback: (value) => value.toFixed(1) + ' MHz',
                    },
                },
                y: {
                    type: 'linear',
                    min: -120,
                    max: 0,
                    title: {
                        display: true,
                        text: 'dBFS',
                    },
                },
            },
            plugins: {
                legend: {
                    display: false,
                },
            },
            datasets: {},
            interaction: {},
            layout: {},
            elements: {},
        };

        if (isDefined(properties)) {
            if (properties.hasOwnProperty('options')) {
                merge(properties.options, this.options);
            }
        }

        this.datasetOptions = (isDefined(properties) && properties.hasOwnProperty('datasetOptions'))
            ? properties.datasetOptions
            : {};

        this.chart = new Chart(this.canvas, {
            type: 'line',
            data: {datasets: []},
            options: this.options,
        });

        this.dataset = {
            data: [],
            borderColor: 'rgba(0, 200, 100, 0.9)',
            borderWidth: 1,
            pointRadius: 0,
            fill: false,
            ...this.datasetOptions,
        };

        this.chart.data.datasets.push(this.dataset);
    }

    /**
     * Returns the analyzer module descriptor.
     * Data arrives pre-analyzed — no FFT needed.
     * @return {{ type: string, format: string, analyzer: null }}
     */
    createAnalyzer() {
        return {type: 'spectrum', format: 'float', analyzer: null};
    }

    /**
     * Render one spectrum frame.
     * @param {Object} decoded
     * @param {number[]|Float32Array} decoded.freqAxis  - Frequency values in Hz
     * @param {number[]|Float32Array} decoded.amplitude - Amplitude values in dBFS
     * @param {number}                decoded.timestamp - ms epoch
     * @param {string}                decoded.channel   - channel identifier
     */
    draw(decoded) {
        if (this.resetting) {
            return;
        }

        const freqAxis  = decoded.freqAxis  || [];
        const amplitude = decoded.amplitude || [];
        const len = Math.min(freqAxis.length, amplitude.length);

        const points = [];
        for (let i = 0; i < len; i++) {
            points.push({x: freqAxis[i] / 1e6, y: amplitude[i]});
        }

        this.dataset.data = points;
        this.chart.update('none');
    }

    /**
     * Clear chart data.
     */
    reset() {
        this.resetting = true;
        this.chart.data.labels = [];
        this.chart.data.datasets.forEach((ds) => {
            ds.data = [];
        });
        this.chart.update('none');
        this.resetting = false;
    }

    /**
     * No-op — spectrum frames are independent snapshots with no playback end event.
     */
    onended() {}
}

export default SpectrumChartJsVisualizer;
