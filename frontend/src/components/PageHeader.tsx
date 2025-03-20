import React, { useState } from "react";
import {
  AppBar,
  Box, Container,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Close, Menu } from "@mui/icons-material";

/**
 * ナビゲーションボタンの型
 */
type NavButton = {
  text: string;
  url: string;
  state?: any;
};

/**
 * ナビゲーションリンク
 */
const setNavLinks: Array<NavButton> = [
  { text: "トップ", url: "/" },
  { text: "書籍を登録", url: "/readBarcode" },
  { text: "書籍を検索", url: "/books" },
  { text: "アカウント設定", url: "/settings" },
  { text: "利用規約", url: "/terms" },
  { text: "プライバシーポリシー", url: "/privacyPolicy" },
];

/**
 * ヘッダーコンポーネント
 * @returns コンポーネント
 */
const PageHeader: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  /**
   * メニューオープン
   */
  const handleDrawerOpen = () => {
    setOpen(true);
  };

  /**
   * メニュークローズ
   */
  const handleDrawerClose = () => {
    setOpen(false);
  };

  /**
   * ナビゲーションボタン押下時のイベントハンドラ
   * @param e イベント引数
   * @param nav 押下したナビゲーション
   */
  const handleNavButton = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, nav: NavButton) => {
    e.preventDefault();
    handleDrawerClose();
    navigate(nav.url, {
      state: nav.state,
    });
  };

  return (
    <>
      <AppBar component="header" position="sticky" sx={{ top: 0 }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box sx={{ marginTop: 'auto', marginBottom: 'auto' }}>
              <Typography component="h1" variant="h6">ツンドク.com (β版)</Typography>
            </Box>
            <Box>
              <List component="nav" sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                <ListItem disablePadding sx={{ width: 'auto' }}>
                  <ListItemButton onClick={handleDrawerOpen} sx={{ textAlign: 'center', display: { xs: 'block', md: 'none' } }}>
                    <ListItemText primary={<Menu />} />
                  </ListItemButton>
                </ListItem>
                {setNavLinks.map((navLink) => (
                  <ListItem key={navLink.text} disablePadding sx={{ width: 'auto' }}>
                    <ListItemButton sx={{ textAlign: 'center', display: { xs: 'none', md: 'block' } }} onClick={(e) => handleNavButton(e, navLink)}>
                      <ListItemText primary={navLink.text} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
            <Drawer anchor="right" open={open} onClose={handleDrawerClose} slotProps={{ paper: { style: { width: '100%' } } }}>
              <List component="nav" sx={{ display: 'block', justifyContent: 'normal' }}>
                <ListItem disablePadding>
                  <ListItemButton onClick={handleDrawerClose} sx={{ textAlign: 'right', borderBottom: 'solid 1px #696969' }}>
                    <ListItemText primary={<Close />} />
                  </ListItemButton>
                </ListItem>
                {setNavLinks.map((navLink) => (
                  <ListItem key={navLink.text} disablePadding>
                    <ListItemButton onClick={(e) => handleNavButton(e, navLink)} sx={{ textAlign: 'center', borderBottom: "solid 1px #696969" }}>
                        <ListItemText primary={navLink.text} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Drawer>
          </Box>
        </Container>
      </AppBar>
    </>
  );
};

export default PageHeader;
