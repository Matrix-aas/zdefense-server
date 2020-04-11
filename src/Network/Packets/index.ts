import * as path from 'path';
import * as fs from 'fs';
import {Packet} from "./Packet";

export default async (): Promise<void> => {
    console.log('Registering packets...');

    const packetClassFiles = fs.readdirSync(__dirname);
    for (const packetClassFile of packetClassFiles) {
        const packetClassFilePathInfo = packetClassFile.split('.');
        if (packetClassFilePathInfo.length !== 2 ||
            packetClassFilePathInfo[0] === 'index' ||
            packetClassFilePathInfo[0] === 'Packet' ||
            packetClassFilePathInfo[1] !== 'js') {
            continue;
        }

        const packetClassImport = (await import(path.join(__dirname, packetClassFile)));
        if (packetClassImport && Object.prototype.hasOwnProperty.call(packetClassImport, 'default')) {
            const packetClass = packetClassImport.default;
            Packet.registerPacket(packetClass);
            console.log(`Packet "${packetClass.name}" (id: ${Packet.getPacketId(packetClass)}) registered!`);
        }
    }

    console.log('Packets successfully registered!');
};
