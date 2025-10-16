import React, { useEffect, useState } from "react";
import {
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
  CircularProgress,
} from "@mui/material";
import { getHistory, deleteImage } from "../services/faceService";
import { toast } from "react-toastify";

export default function DashboardPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await getHistory();
      setHistory(res.data.history);
      toast.success("History loaded successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to load history!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteImage(id);
      toast.success("Image deleted successfully!");
      fetch();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete image!");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <Typography variant="h4" className="mb-4">
        Upload History
      </Typography>
      {loading ? (
        <div>Loading...</div>
      ) : history.length === 0 ? (
        <div className="text-gray-500">No uploads yet</div>
      ) : (
        <Grid container spacing={2}>
          {history.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item._id}>
              <Card className="flex flex-col">
                <CardMedia
                  component="img"
                  image={item.image}
                  alt="uploaded"
                  sx={{
                    width: "100%",
                    height: 200,
                    objectFit: "cover",
                  }}
                />
                <CardContent className="flex flex-col flex-1">
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
                      onClick={() => handleDelete(item._id)}
                      disabled={deletingId === item._id}
                    >
                      {deletingId === item._id ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        "Delete"
                      )}
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
