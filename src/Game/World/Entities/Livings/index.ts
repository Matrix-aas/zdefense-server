import * as path from 'path';
import * as fs from 'fs';
import Entity, {EntityNotDecorated} from "../Entity";

export default async (): Promise<void> => {
    console.log('Registering EntityLivings...');

    const entityClassFiles = fs.readdirSync(__dirname);
    for (const entityClassFile of entityClassFiles) {
        const entityClassFilePathInfo = entityClassFile.split('.');
        if (entityClassFilePathInfo.length !== 2 ||
            entityClassFilePathInfo[0] === 'index' ||
            entityClassFilePathInfo[1] !== 'js') {
            continue;
        }

        const entityClassImport = (await import(path.join(__dirname, entityClassFile)));
        if (entityClassImport && Object.prototype.hasOwnProperty.call(entityClassImport, 'default')) {
            const entityClass = entityClassImport.default;
            try {
                Entity.registerEntity(entityClass);
            } catch (e) {
                if (e instanceof EntityNotDecorated) {
                    continue;
                } else {
                    throw e;
                }
            }
            console.log(`EntityLiving "${entityClass.name}" (id: ${Entity.getEntityTypeId(entityClass)}) registered!`);
        }
    }

    console.log('EntityLivings successfully registered!');
};
