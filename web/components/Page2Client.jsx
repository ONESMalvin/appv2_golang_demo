import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useMemoizedFn } from 'ahooks';
import { ConfigProvider, Select, Button, Typography, Card } from '@ones-design/core';
import { Table } from '@ones-design/table';
import { ONES } from '@ones-open/sdk';

const { Title, Text } = Typography;

const Page2Client = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teamUsers, setTeamUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.ONES && ONES) {
      window.ONES = ONES;
    }
  }, []);

  const fetchTeams = useMemoizedFn(async () => {
    if (!ONES) {
      return;
    }
    setLoading(true);
    try {
      const res = await ONES.fetchOpenAPI('/v2/account/teams');
      const data = await res.json();
      const teamList = (data?.data?.teams || []).map((team) => ({
        ...team,
        createdAt: new Date(team.createTime / 1000).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }));
      setTeams(teamList);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('获取团队列表失败:', error);
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const onTeamSelect = useMemoizedFn(async (value) => {
    setSelectedTeam(value || null);
    if (!value) {
      setTeamUsers([]);
      setProjects([]);
      return;
    }
    fetchTeamUsers(value);
    fetchProjects(value);
  });

  const fetchTeamUsers = useMemoizedFn(async (value) => {
    if (!ONES) {
      return;
    }
    try {
      const res = await ONES.fetchOpenAPI(`/v2/account/users/search?teamID=${value}`);
      const data = await res.json();
      setTeamUsers(data?.data?.list || []);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('获取用户列表失败:', error);
    }
  });

  const fetchProjects = useMemoizedFn(async (value) => {
    if (!ONES) {
      return;
    }
    try {
      const res = await ONES.fetchOpenAPI(`/v2/project/projects?teamID=${value}`);
      const data = await res.json();
      const projectList = (data?.data?.list || []).map((project) => ({
        ...project,
        createdAt: new Date(project.createTime).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }));
      setProjects(projectList);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('获取项目列表失败:', error);
    }
  });

  return (
    <ConfigProvider>
      <Head>
        <title>自定义页面</title>
      </Head>
      <div className="container">
        <Card style={{ marginBottom: '24px' }}>
          <div className="header">
            <Title level={3} style={{ margin: 0 }}>
              团队列表
            </Title>
            <Button type="primary" onClick={fetchTeams} loading={loading}>
              刷新团队
            </Button>
          </div>
          <Table
            loading={loading}
            columns={[
              {
                dataIndex: 'id',
                lock: true,
                width: 120,
                name: '团队UUID',
                render: (text) => <Text code>{text}</Text>,
              },
              {
                dataIndex: 'name',
                name: '团队名称',
                width: 150,
              },
              {
                dataIndex: 'createdAt',
                name: '创建日期',
                width: 180,
              },
              {
                dataIndex: 'owner',
                name: '团队负责人',
                width: 150,
              },
            ]}
            dataSource={teams}
            scroll={{ x: 600, y: 400 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        </Card>

        <Card style={{ width: '100%', marginBottom: '24px' }}>
          <Title level={4} style={{ marginBottom: '16px' }}>
            选择团队
          </Title>
          <Select
            style={{ width: '100%' }}
            placeholder="请选择团队"
            options={teams.map((team) => ({
              label: team.name,
              value: team.id,
            }))}
            value={selectedTeam || undefined}
            onChange={onTeamSelect}
            allowClear
          />
        </Card>

        {selectedTeam ? (
          <>
            <Card style={{ marginBottom: '24px' }}>
              <Title level={4} style={{ marginBottom: '16px' }}>
                团队成员
              </Title>
              <Table
                columns={[
                  {
                    dataIndex: 'id',
                    lock: true,
                    width: 120,
                    name: '用户UUID',
                    render: (text) => <Text code>{text}</Text>,
                  },
                  {
                    dataIndex: 'name',
                    name: '用户名称',
                    width: 150,
                  },
                  {
                    dataIndex: 'email',
                    name: '邮箱',
                    width: 200,
                  },
                ]}
                dataSource={teamUsers}
                scroll={{ x: 470, y: 300 }}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条记录`,
                }}
              />
            </Card>

            <Card>
              <Title level={4} style={{ marginBottom: '16px' }}>
                项目列表
              </Title>
              <Table
                columns={[
                  {
                    dataIndex: 'id',
                    width: 120,
                    name: '项目UUID',
                    render: (text) => <Text code>{text}</Text>,
                  },
                  {
                    dataIndex: 'name',
                    name: '项目名称',
                    width: 200,
                  },
                  {
                    dataIndex: 'createdAt',
                    name: '创建时间',
                    width: 180,
                  },
                ]}
                dataSource={projects}
                scroll={{ x: 500, y: 300 }}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条记录`,
                }}
              />
            </Card>
          </>
        ) : null}
      </div>
      <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 100%;
          padding: 24px;
          background-color: #f5f5f5;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
      `}</style>
    </ConfigProvider>
  );
};

export default Page2Client;
