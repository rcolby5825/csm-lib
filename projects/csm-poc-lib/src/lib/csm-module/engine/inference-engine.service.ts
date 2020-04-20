import {Injectable} from '@angular/core';

/**
* Inference engine for managing graph nodes.
*/
@Injectable({ providedIn: 'root', })
export class InferenceEngineService {

  packetCloud: any = {};

 /**
  * Constructor.
  */
  constructor() {
  } // end constructor

  /**
   * Add information packet as JSON name/value pairs to packet cloud.
   *
   * @param source - source identifier
   * @param packet - set of name/value pairs in JSON object that represents object
   */
  public setInformationPacket(source: string, packet: any): void {
    // Add packet to cloud
    packet['source'] = source;
    this.packetCloud[source] = packet;
  }

  /**
   * Create packet from identifier array, then add packet.
   *
   * @param source - source identifier
   * @param identifierArray - array of text and identifier JSON objects
   */
  setInformationPacketFromArray(source: string, identifierArray: any[], text: string): void {
    // Add each text identifier to JSON packet
    const packet = {};
    let itemAdded = false;
    packet['FullText'] = text;
    for (let i = 0; i < identifierArray.length; i++) {
      const item = identifierArray[i];
      for (let j = 0; j < item.identifier.length; j++) {
        const identifierInfo = item.identifier[j];
        const type = identifierInfo.pos;
        const word = text.substring(identifierInfo.start, identifierInfo.end);
        packet[word] = type;
        itemAdded = true;
      }
    }

    // Add packet as information packet with source
    if (itemAdded) {
      this.setInformationPacket(source, packet);
    }
  }

  /**
   * Return packet by name.
   *
   * @param source name of packet
   * @return Packet
   */
  public getPacket(source: string): any {
    return this.packetCloud[source];
  }

  /**
   * Get related packets based on packet to packet scoring for relevance.
   *
   * @param packet - packet to relate
   * @returns array of packets with scores in form: [score, packet]
   */
  public getRelatedPackets(packet: any, excludeSource?: string, ratingSet?: string[]): any[] {
    // Iterate through packets
    const packetRatings = [];
    for (const targetPacketKey of this.packetCloud) {
      // Rate packet and store in sortable array
      const targetPacket = this.packetCloud[targetPacketKey];
      if (excludeSource === undefined || targetPacket['source'] !== excludeSource) {
        const rating = this.ratePacket(packet, targetPacket, ratingSet);
        if (rating > 0) {
          packetRatings.push([rating, targetPacket]);
        }
      }
    }

    return packetRatings;
  }

  /**
   * Rate packet against target packet according to match and rating weight.
   *
   * @param packet - packet to relate
   * @param targetPacket - packet to rate against
   * @returns number of rating. The high the number, the more relevance the packet has
   */
  public ratePacket(packet: any, targetPacket: any, ratingSet?: string[]): number {
    let result = 0;

    // Iterate through each property, and increment rating if data matches
    for (const key of packet) {
      // Check if value is in rating set
      let checkKey = true;
      if (ratingSet) {
        checkKey = false;
        const thisKey = this.getKey(packet, key);
        if (thisKey) {
          for (let i = 0; i < ratingSet.length; i++) {
            if (thisKey === ratingSet[i]) {
              checkKey = true;
              break;
            }
          }
        }
      }

      // Get parts of key
      if (checkKey) {
        const parts = key.split(' ');
        for (let i = 0; i < parts.length; i++) {
          // Check for property and value in targetPacket
          const part = parts[i].trim();
          const value1 = this.getAttributeFromPartialKey(part, packet);
          const value2 = this.getAttributeFromPartialKey(part, targetPacket);
          if (value1 && value2) {
            result++;
            break;          // Only increase rating once per set of parts
          }
        }
      }
    }

    return result;
  }

  /**
   * Get named key in object.
   *
   * @params object
   * @params value
   */
  private getKey(object: any, value: string): string {
    for (const key in object) {
      if (object[key] === value) {
        return key;
      }
    }
    return undefined;
  }

  /**
   * Get attribute from key.
   *
   * @params partialKey
   * @params targetPacket
   * @returns attribute
   */
  private getAttributeFromPartialKey(partialKey: string, targetPacket: any): string {
    for (const key in targetPacket) {
      if (key.toLowerCase().indexOf(partialKey.toLowerCase()) !== -1) {
        return targetPacket[key];
      }
    }
    return undefined;
  }

  /**
   * Build identifier mapping.
   *
   * @params dataRow
   * @returns identifier mapping
   */
  public buildIdentifierMapping(dataRow: any): any {
    // Build array of mappings for current page. This is TEMP. The back-end should provide the mapping
    const identifierMapping = {};
    for (const key of dataRow) {
      const value = dataRow[key] + '';
      identifierMapping[value] = key;
    }

    return identifierMapping;
  }
}
