import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Authenticator } from '@aws-amplify/ui-react';
import { getCurrentUser, GetCurrentUserOutput } from "aws-amplify/auth";
import axios from "axios";

import config from "../config.json";

import { LoadingContext } from "../context/LoadingProvider";

import {
  BookSummary,
  GetBooksResponse,
} from "../types/book";

import {
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Typography
} from "@mui/material";

const Books: React.FC = () => {
  const navigate = useNavigate();
  const { setIsLoadingOverlay } = useContext(LoadingContext);
  const [user, setUser] = useState<GetCurrentUserOutput>();
  const [books, setBooks] = useState<BookSummary[]>();
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [emptyRows, setEmptyRows] = useState<number>(0);

  const getCurrentUserAsync = async () => {
    const result = await getCurrentUser();
    console.log(result);
    setUser(result);
  };

  const getBooksAsync = async () => {
    setIsLoadingOverlay(true);

    let lastEvaluatedKey = 0;
    let isError = false;
    let items: BookSummary[] = [];

    while (lastEvaluatedKey > -1 && !isError) {
      const url = `${config.ApiEndpoint}/get-books`;
      await axios.post(url, {
        userName: user?.signInDetails?.loginId ?? '',
        pageSize: 20,
        lastEvaluatedKey: lastEvaluatedKey
      })
        .then(response => {
          const res: GetBooksResponse = response.data;
          items.push(...res.items);
          if (res.lastEvaluatedKey) {
            lastEvaluatedKey = res.lastEvaluatedKey.seqno;
          } else {
            lastEvaluatedKey = -1;
          }
        })
        .catch(error => {
          console.log(error);
          isError = true;
        })
        .finally(() => {
          setIsLoadingOverlay(false);
        });
    }

    setBooks(items);
  };

  useEffect(() => {
    getCurrentUserAsync();
  }, [])

  useEffect(() => {
    if (user) {
      getBooksAsync();
    }
  }, [user]);

  useEffect(() => {
    if (books) {
      // Avoid a layout jump when reaching the last page with empty rows.
      setEmptyRows(page > 0 ? Math.max(0, (1 + page) * rowsPerPage - books.length) : 0);
    }
  }, [books]);

  const handleChangePage = (e: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  return (
    <Authenticator>
      <Stack spacing={2} direction='column' margin={4}>
        <Typography variant='h3' component='div' gutterBottom>
          書籍一覧
        </Typography>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>タイトル</TableCell>
                <TableCell>著者</TableCell>
                <TableCell>出版社</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(rowsPerPage > 0
                ? books?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : books
              )?.map((book) => (
                <TableRow
                  key={book.seqno}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component='th' scope='row'>{book.title}</TableCell>
                  <TableCell>{book.author}</TableCell>
                  <TableCell>{book.publisherName}</TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  colSpan={3}
                  count={books?.length ?? 0}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  slotProps={{
                    select: {
                      inputProps: {
                        'aria-label': 'rows per page',
                      },
                      native: true,
                    },
                  }}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
        <Button fullWidth variant='outlined' onClick={() => navigate('/')}>ホームに戻る</Button>
      </Stack>
    </Authenticator>
  );
}

export default Books;
