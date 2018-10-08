# fb-gallery-linker

A command line utilty for creating persistent preview links to Facebook photo galleries.  It will render a screenshot of a Facebook photo gallery thumbnail view, upload a scaled JPEG file to an AWS S3 bucket, and return a markup for an `<img>` tag for the JPEG wrapped in an anchor tag link back to the source gallery page.

This project may be useful for those who want a persistent thumbnail view of a gallery for their own site, which links back to the complete gallery elsewhere.  It uses the node.js runtime and assumes that node.js and the yarn package manager are already installed.

Generally, it captures the thubmnails available on first page load, which tends to be the first 10 rows.

## Install

First, install the npm dependencies in the project directory:

```bash
yarn install
```

To provision credentials, copy the `.env.example` file to a new `.env` file.  

- For access to non-public Facebook gallery pages, add a valid username and password to the `FB_EMAIL` and `FB_PASS` fields.
- Add a valid bucket name for the S3 bucket for image upload to the `S3_BUCKETNAME` field.
- If running locally, add a valid AWS access key to the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` fields.  These fields should be removed if running on an AWS resource with role based permissions, or if running locally with a user based credential at `~/.aws/credentials`

## Usage

Once installed, the script can be run from the project directory by using `node index.js` to invoke it with a `--url=""` parameter:

```console
$ node index.js --url="https://<gallery url>"
Import saved cookies
Write cookies to file...
File uploaded successfully at https://<bucketname>.s3.amazonaws.com/gallery-thumbs/fbset-scaled-<set-id>.jpg
<a href="https:<gallery url>"><img src="https://<bucketname>.s3.amazonaws.com/gallery-thumbs/fbset-scaled-<set-id>.jpg" width="500" height="327"/></a>
tag copied to clipboard
```

Where `<gallery url>` is the full URL to the gallery to be linked.  

The script uses puppeteer to run a headless chrome browser that logs in to the gallery page and captures the thumbnail view.  It will capture a login cookie in order to speed up subsequent sessions.  It writes the full size gallery screenshot `.png` file and the sized `.jpg` file in the gitingored `output/` directory.

Finally it outputs the resulting markup to the command line output, and on Mac OS X systems uses the `pbcopy` command to send the markup directly to the system clipboard.  This markup can be pasted in any html page to add the gallery image and link.
