import React from "react";
import { Container, Grid, Card, CardMedia, CardHeader, Fab, makeStyles, createStyles, LinearProgress } from "@material-ui/core";
import { useFilePicker } from 'use-file-picker';
import UploadIcon from "@material-ui/icons/BackupRounded";

import { Storage } from "aws-amplify";


interface PathInfo {
  key: string;
  url?: string;
}


const useStyles = makeStyles(theme => createStyles({
  fab: {
    position: "absolute",
    bottom: theme.spacing(2),
    right: theme.spacing(2)
  },
  imagePreview: {
    aspectRatio: "1"
  }
}));

export const ImageList: React.FC = () => {
  const classes = useStyles();
  const [currentProgress, setProgress] = React.useState<number | null>(null);
  const [images, setImages] = React.useState<Array<PathInfo>>([]);

  const [showPicker, { plainFiles }] = useFilePicker({
    multiple: false,
    accept: ['.jpg', '.png'],
    readFilesContent: false
  });

  const refreshList = async () => {
    const result: Array<{ key: string; }> = await Storage.list(``, {
      level: "private",
    });
    const keys = result.filter(x => Boolean(x.key));
    const newImages = await Promise.all(keys.map(async (key) => {
      const signedUrl = await Storage.get(key.key, {
        level: "private"
      });

      return {
        ...key,
        url: signedUrl,
      } as PathInfo;
    }));

    setImages(newImages);
  }

  React.useEffect(() => {
    refreshList();
  }, []);

  React.useEffect(() => {
    const file = plainFiles?.[0];

    if (file) {
      Storage.put(file.name, file, {
        level: 'private',
        progressCallback(progress: { loaded: number; total: number }) {
          setProgress(progress.loaded / progress.total);
        }
      })
        .then(refreshList)
        .then(() => setProgress(null));
    }
  }, [plainFiles]);

  return <>
    <Container>
      {currentProgress && <LinearProgress value={currentProgress} />}
      <Grid container spacing={2}>
        {images.map((img) => <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardHeader title={img.key} />
            <CardMedia image={img.url} className={classes.imagePreview} />
          </Card>
        </Grid>)}
      </Grid>
    </Container>

    {currentProgress === null && <Fab className={classes.fab} color="primary" onClick={showPicker}>
      <UploadIcon />
    </Fab>}
  </>;
}