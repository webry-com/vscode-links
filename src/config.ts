import path from "path"
import fs from "fs"

const CONFIG_FILE_NAMES = ["vsc-links.config.js", "vsc-links.config.mjs"]

export function findConfigFile(workspacePath: string): {
  path: string
  name: string
} | null {
  for (const fileName of CONFIG_FILE_NAMES) {
    const filePath = path.join(workspacePath, fileName)
    if (fs.existsSync(filePath)) {
      // Sort to reduce lookups in the future
      CONFIG_FILE_NAMES.sort((file) => (file === fileName ? -1 : 1))
      return {
        path: filePath,
        name: fileName,
      }
    }
  }
  return null
}
