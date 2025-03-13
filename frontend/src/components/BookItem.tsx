import React from "react";
import { BookSummary } from "../types/book";

import {
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography
} from "@mui/material";
import {
  BusinessRounded,
  MenuBookRounded,
  PersonRounded
} from "@mui/icons-material";

type BookItemProps = {
  book: BookSummary;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
};

const BookItem: React.FC<BookItemProps> = ({ book, onClick }) => {
  return (
    <Card>
      <CardActionArea onClick={onClick}>
        <CardContent sx={{ padding: 0.25 }}>
          <Stack direction='column' margin={2} spacing={1}>
            <Stack direction='row' spacing={1} alignItems='center'>
              <MenuBookRounded />
              <Typography
                variant="subtitle1"
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: "2",
                  WebkitBoxOrient: "vertical",
                }}>
                {book.title}
              </Typography>
            </Stack>
            {book.author && (
              <Stack direction='row' spacing={1} alignItems='center'>
                <PersonRounded />
                <Typography variant="body2" noWrap>{book.author}</Typography>
              </Stack>
            )}
            {book.publisherName && (
              <Stack direction='row' spacing={1} alignItems='center'>
                <BusinessRounded />
                <Typography variant="body2" noWrap>{book.publisherName}</Typography>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default BookItem;
