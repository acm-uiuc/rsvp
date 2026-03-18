import {
  Group,
  Burger,
  Menu,
  Button,
  Avatar,
  Text,
  ActionIcon,
  rem,
} from "@mantine/core";
import { IconChevronDown, IconLogout, IconUser, IconSun, IconMoon } from "@tabler/icons-react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import LogoBadge from "../Logo";
import { useColorScheme } from "../../App";

interface HeaderProps {
  opened: boolean;
  toggle: () => void;
}

export function Header({ opened, toggle }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [colorScheme, setColorScheme] = useColorScheme();

  const formattedName = user?.name
    ? user.name.split(',').map(part => part.trim()).reverse().join(' ')
    : '';

  return (
    <Group h="100%" px="md" justify="space-between">
      <Group>
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        <LogoBadge size="1em" linkTo="/" showText={true} />
      </Group>

      <Group gap="xs">
        <ActionIcon
          variant="subtle"
          size="lg"
          onClick={() => setColorScheme(s => s === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle color scheme"
        >
          {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
        </ActionIcon>

        <Menu shadow="md" width={200}>
          <Menu.Target>
            <Button variant="subtle" rightSection={<IconChevronDown size={14} />}>
              <Group gap={7}>
                <Avatar src={null} alt={formattedName} radius="xl" size={20} color="blue" />
                <Text fw={500} size="sm" lh={1} mr={3}>
                  {formattedName || "User"}
                </Text>
              </Group>
            </Button>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>My Account</Menu.Label>
            <Menu.Item
              leftSection={<IconUser style={{ width: rem(14), height: rem(14) }} />}
              onClick={() => navigate("/profile", { replace: true })}
            >
              Profile
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              color="red"
              leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
              onClick={() => logout()}
            >
              Logout
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Group>
  );
}
