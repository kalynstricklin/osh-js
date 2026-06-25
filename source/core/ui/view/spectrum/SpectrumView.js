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

import View from "../View.js";
import {isDefined} from "../../../utils/Utils.js";

/**
 * Pure data-forwarding view for RF/signal spectrum observations.
 * Pairs with {@link SpectrumDataLayer} and one or more {@link SpectrumChartJsVisualizer}
 * instances.  No Web Audio API, no decoder, no AudioContext — incoming
 * { freqAxis, amplitude, timestamp, channel } objects are forwarded directly
 * to each registered visualizer.
 *
 * @extends View
 * @example
 *
 import SpectrumView from 'osh-js/core/ui/view/spectrum/SpectrumView';

 let spectrumView = new SpectrumView({
     container:   'spectrum-container',
     visualizers: [mySpectrumVisualizer],
     layers:      [mySpectrumDataLayer],
 });
 */
class SpectrumView extends View {

    /**
     * Create a SpectrumView.
     * @param {Object} [properties={}] - the properties of the view
     * @param {string} properties.container - The div element id to attach to
     * @param {Object[]} [properties.visualizers=[]] - Initial visualizer instances
     * @param {Object[]} [properties.layers=[]] - Initial SpectrumDataLayer instances
     */
    constructor(properties) {
        super({
            supportedLayers: ['spectrumData'],
            visualizers: [],
            ...properties,
        });
        this.visualizers = this.properties.visualizers;
        this.visualizersMap = {};
        this.initVisualizers();
    }

    initVisualizers() {
        this.visualizersMap = {};
        for (let visualizer of this.visualizers) {
            /**
             * Module is { type: 'spectrum', format: 'float', analyzer: null }
             * Data arrives pre-analyzed — no FFT node needed.
             */
            this.visualizersMap[visualizer.id] = visualizer.createAnalyzer();
        }
    }

    /**
     * Add a visualizer after construction.
     * @param {Object} visualizer - A SpectrumChartJsVisualizer (or compatible) instance
     */
    addVisualizer(visualizer) {
        this.visualizersMap[visualizer.id] = visualizer.createAnalyzer();
        this.visualizers.push(visualizer);
    }

    async setData(dataSourceId, data) {
        if (data.type === 'spectrumData') {
            const values = data.values;
            for (let i = 0; i < values.length; i++) {
                const value = values[i];
                const decoded = {
                    freqAxis:  value.freqAxis,
                    amplitude: value.amplitude,
                    timestamp: value.timestamp,
                    channel:   value.channel,
                };
                for (let visualizer of this.visualizers) {
                    visualizer.draw(decoded);
                }
            }
        }
    }

    reset() {
        super.reset();
        for (let visualizer of this.visualizers) {
            visualizer.reset();
        }
    }
}

export default SpectrumView;
