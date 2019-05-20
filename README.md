# barsPlus
This extension is part of the extension bundles for Qlik Sense. The repository is maintained and moderated by Qlik RD.

Feel free to fork and suggest pull requests for improvements and bug fixes. Changes will be moderated and reviewed before inclusion in future bundle versions. Please note that emphasis is on backward compatibility, i.e. breaking changes will most likely not be approved.

Usage documentation for the extension is available at https://help.qlik.com.

# Developing the extension
If you want to do code changes to the extension follow these simple steps to get going.

1. Get Qlik Sense Desktop
1. Create a new app and add Bar & area chart to a sheet.
2. Clone the repository
3. Run `npm install`
4. Run `npm run build` - to build a dev-version to the /dist folder.
5. Move the content of the /dist folder to the extension directory. Usually in `C:/Users/<user>/Documents/Qlik/Sense/Extensions/qlik-barplus-chart`.

# Original author
[github.com/LarryWoodside](https://github.com/LarryWoodside)

# License
Released under the [MIT License](LICENSE).

The external library D3 is used within this solution:

**D3**
* License: BSD 3-Clause "New" or "Revised" License
* Url: http://d3js.org/
* Author: Michael Bostock
