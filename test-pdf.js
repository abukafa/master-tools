const { PDFParse } = require('pdf-parse');
const fs = require('fs');

async function test() {
  try {
    const parser = new PDFParse();
    console.log("PDFParse instance created");
    // we don't have a pdf file, but we can see if it requires buffer
  } catch(e) {
    console.log(e);
  }
}
test();
