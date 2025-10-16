import React, { useEffect, useState } from "react";
import {
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
} from "@mui/material";
import { getHistory, deleteImage } from "../services/faceService";

export default function DashboardPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await getHistory();
      setHistory(res.data.history);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  return (
    <div>
      <Typography variant="h4" className="mb-4">
        Upload History
      </Typography>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <Grid container spacing={2}>
          {history.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item._id}>
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  image={item.image}
                  alt="uploaded"
                />
                <CardContent>
                  <Typography>Faces: {item.facesDetected}</Typography>
                  <Typography variant="caption">
                    {new Date(item.createdAt).toLocaleString()}
                  </Typography>
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="outlined"
                      size="small"
                      href={item.image}
                      target="_blank"
                    >
                      View
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      color="error"
                      onClick={async () => {
                        await deleteImage(item._id);
                        fetch();
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </div>
  );
}
