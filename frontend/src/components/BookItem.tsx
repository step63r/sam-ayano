import React from "react";
import { BookSummary } from "../types/book";

import {
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
  Box
} from "@mui/material";
import {
  BusinessRounded,
  MenuBookRounded,
  PersonRounded
} from "@mui/icons-material";

/**
 * BookItemコンポーネントのプロパティ
 */
type BookItemProps = {
  /** 書籍サマリ */
  book: BookSummary;
  /** クリックイベント */
  onClick: React.MouseEventHandler<HTMLButtonElement>;
};

/**
 * 書籍情報一覧のアイテムコンポーネント
 * @param param0 プロパティ
 * @returns コンポーネント
 */
const BookItem: React.FC<BookItemProps> = ({ book, onClick }) => {
  return (
    <Card sx={{ position: 'relative' }}>
      {book.lendFlag && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'error.light',
            color: 'error.contrastText',
            border: '1px solid',
            borderColor: 'error.main',
            borderRadius: 1,
            px: 1,
            py: 0.25,
            boxShadow: 1,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            貸出中
          </Typography>
        </Box>
      )}
      <CardActionArea onClick={onClick}>
        <CardContent sx={{ padding: 0.25 }}>
          <Stack direction='column' margin={2} spacing={1}>
            <Stack direction='row' spacing={1} alignItems='center'>
              <MenuBookRounded />
              <Typography
                variant="subtitle1"
                sx={{
                  pr: book.lendFlag ? 8 : 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: "2",
                  WebkitBoxOrient: "vertical",
                }}
              >
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
