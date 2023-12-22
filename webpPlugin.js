const webp = require('webp-converter');
const fs = require('fs');
//pass input image(.jpeg,.pnp .....) path ,output image(give path where to save and image file name with .webp extension)
//pass option(read  documentation for options)

//cwebp(input,output,option)
class WebpConverterPlugin {
    apply(compiler) {
        compiler.hooks.initialize.tap('WebpConverterPlugin', () => {
            console.log("start conversion");
            const images = fs.readdirSync("assets");
            images.forEach((dirname) => {
                if (dirname.includes(".png") || dirname.includes(".jpg")) {
                    console.log("converting " + dirname);
                    const result = webp.cwebp("assets/" + dirname, "assets/" + dirname, "-q 80");
                    result.then((response) => {
                        console.log("done for" + dirname + ", response: ", response);
                    });
                }
            })
        });
    }
}

module.exports = WebpConverterPlugin;