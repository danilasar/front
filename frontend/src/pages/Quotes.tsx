import { useEffect } from "react";
import { Box, Pagination, Stack } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchQuotes } from "../store/quote/thunks";
import { QuoteCard } from "../components/QuoteCard";
import { GridBackGroundLayout } from "../ui/GridBackGroundLayout";


// NOTE: сделать в контейнере который внутри себя скролится и пагинация поверх карточек
export const QuotesPage = () => {
  const dispatch = useAppDispatch();

  const { quotes, offset, limit, total } = useAppSelector((state) => state.quotes);

  const page = Math.floor(offset / limit) + 1;
  const pageCount = Math.ceil(total / limit);

  useEffect(() => {
    const getQuotes = async () => {
      await dispatch(fetchQuotes({ offset: offset, limit: limit }));
    };
    getQuotes()
  }, [dispatch, limit, offset]);

  const handlePageChange = async (_: React.ChangeEvent<unknown>, value: number) => {
    const newOffset = (value - 1) * limit;
    await dispatch(fetchQuotes({ offset: newOffset, limit }));
  };

  return (
    <GridBackGroundLayout>
      <Stack
        spacing={3}
        alignItems="center"
        sx={{ width: "100%", py: 4, mt: 10 }}
      >
        {quotes.map((quote, index) => (
          <QuoteCard key={index} quote={quote} />
        ))}

        <Box mt={2}>
          <Pagination
            page={page}
            count={pageCount}
            onChange={handlePageChange}
          />
        </Box>
      </Stack>
    </GridBackGroundLayout>
  );
};
