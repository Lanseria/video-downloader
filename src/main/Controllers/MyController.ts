import { Controller, IpcInvoke, IpcOn } from "../decorators";
import { MyService } from "../Services/MyService";
import { EVENTS } from "@common/events";
import { ImportJson, OpenedFolderData, UploadMedia } from "@common/dto";
import { readFile, writeJson } from "@main/utils/fs";
import { FileService } from "@main/Services/FileService";
@Controller()
export class MyController {
  constructor(private myService: MyService, private fileService: FileService) {}

  @IpcOn(EVENTS.REPLY_SAVE_FILE)
  public replySaveFile(filepath: string) {
    return filepath;
  }

  @IpcOn(EVENTS.REPLY_OPEN_IMPORT_FILE)
  public replyOpenImportFile(data: Partial<ImportData>) {
    const importData = new ImportJson(data);
    return importData;
  }

  @IpcOn(EVENTS.REPLY_OPEN_DIST_FOLDER)
  public replyOpenDistFolder(data: Partial<OpenedFolder>) {
    const openedFoler = new OpenedFolderData(data);
    return openedFoler;
  }

  @IpcInvoke(EVENTS.SAVE_FILE)
  public async handleSaveFile({
    title,
    path,
    data,
  }: {
    title: string;
    path: string;
    data: IObj;
  }) {
    this.fileService.onSaveFile(title, path).then((file) => {
      if (!file.canceled) {
        const filepath = file.filePath!.toString();
        // Creating and Writing to the sample.json file
        writeJson(filepath, data)
          .then(() => {
            this.replySaveFile(filepath);
          })
          .catch((err) => {
            console.log(err);
          });
      }
    });
  }

  @IpcInvoke(EVENTS.OPEN_IMPORT_FILE)
  public async handleOpenImportFile(id: string) {
    try {
      const fileObj = await this.fileService.onOpenJsonFile();
      if (fileObj.canceled || fileObj.filePaths.length === 0) {
        this.replyOpenImportFile({
          id,
        });
      } else {
        const data = await readFile(fileObj.filePaths[0], {
          encoding: "utf-8",
        });
        this.replyOpenImportFile({
          id,
          data,
        });
      }
    } catch (error: any) {
      console.log(error);
    }
  }

  @IpcInvoke(EVENTS.OPEN_DIST_FOLDER)
  public async handleOpenDistFolder(id: string) {
    try {
      const folderObj = await this.fileService.onOpenFolder();
      // { canceled: false, filePaths: [ 'D:\\Downloads' ] }
      // console.log(folderObj);
      if (folderObj.canceled || folderObj.filePaths.length === 0) {
        this.replyOpenDistFolder({
          id,
        });
      } else {
        const path = folderObj.filePaths[0];
        this.replyOpenDistFolder({
          id,
          path,
        });
      }
    } catch (error) {
      console.log(error);
    }
  }
}
