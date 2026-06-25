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

import Layer from "./Layer.js";
import {isDefined} from "../../utils/Utils.js";

/**
 * Layer for RF/signal spectrum observations delivered as pre-analyzed frequency/amplitude arrays.
 * Extends Layer directly (same base as BinaryDataLayer) so that the addFn / definedId /
 * updateProperty pipeline works correctly through Layer.setData().
 *
 * Each observation provides:
 *   getFrequencyAxis(rec) → number[] | Float32Array   (Hz values)
 *   getAmplitude(rec)     → number[] | Float32Array   (dBFS values)
 *   getTimestamp(rec)     → number                    (ms epoch)
 *   getChannel(rec)       → string                    (e.g. "ch0")
 *
 * @extends Layer
 * @example
 *
 * import SpectrumDataLayer from 'osh-js/core/ui/layer/SpectrumDataLayer';
 *
 * const layer = new SpectrumDataLayer({
 *     dataSourceId: myDataSource.id,
 *     getFrequencyAxis: (rec) => rec.kraken_spectrum.frequency_axis,
 *     getAmplitude:     (rec) => rec.kraken_spectrum.amplitude,
 *     getTimestamp:     (rec) => new Date(rec.kraken_spectrum.time).getTime(),
 *     getChannel:       (rec) => rec.kraken_spectrum.channel,
 * });
 */
class SpectrumDataLayer extends Layer {

    constructor(properties) {
        super(properties);
        this.type = 'spectrumData';
    }

    // called by super class constructor
    init(properties = this.properties) {
        super.init(properties);

        const props = {
            freqAxis:  [],
            amplitude: [],
            timestamp: 0,
            channel:   ''
        };

        this.definedId('spectrumDataId', props);

        if (isDefined(properties.getFrequencyAxis)) {
            let fn = async (rec, timestamp, options) => {
                this.updateProperty('freqAxis', await this.getFunc('getFrequencyAxis')(rec, timestamp, options));
            };
            this.addFn(this.getDataSourcesIdsByProperty('getFrequencyAxis'), fn);
        }

        if (isDefined(properties.getAmplitude)) {
            let fn = async (rec, timestamp, options) => {
                this.updateProperty('amplitude', await this.getFunc('getAmplitude')(rec, timestamp, options));
            };
            this.addFn(this.getDataSourcesIdsByProperty('getAmplitude'), fn);
        }

        if (isDefined(properties.getTimestamp)) {
            let fn = async (rec, timestamp, options) => {
                this.updateProperty('timestamp', await this.getFunc('getTimestamp')(rec, timestamp, options));
            };
            this.addFn(this.getDataSourcesIdsByProperty('getTimestamp'), fn);
        }

        if (isDefined(properties.getChannel)) {
            let fn = async (rec, timestamp, options) => {
                this.updateProperty('channel', await this.getFunc('getChannel')(rec, timestamp, options));
            };
            this.addFn(this.getDataSourcesIdsByProperty('getChannel'), fn);
        }
    }
}

export default SpectrumDataLayer;
